import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  userId: string;
  feature: string;
  count: number;
  limit: number;
  resetAt: Date;
}

const PLAN_LIMITS = {
  free: { ai_requests: 10, study_sets: 3, flashcards: 50, storage_bytes: 50 * 1024 * 1024 },
  monthly: {
    ai_requests: -1,
    study_sets: -1,
    flashcards: -1,
    storage_bytes: 10 * 1024 * 1024 * 1024,
  },
  yearly: {
    ai_requests: -1,
    study_sets: -1,
    flashcards: -1,
    storage_bytes: 10 * 1024 * 1024 * 1024,
  },
};

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionService.name);
  private stripe: Stripe;
  private readonly monthlyPriceId: string;
  private readonly yearlyPriceId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    });
    this.monthlyPriceId = this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY', '');
    this.yearlyPriceId = this.configService.get<string>('STRIPE_PRICE_ID_YEARLY', '');
  }

  async onModuleInit() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          stripe_customer_id VARCHAR(255) NOT NULL,
          stripe_subscription_id VARCHAR(255),
          plan VARCHAR(50) DEFAULT 'free',
          status VARCHAR(50) DEFAULT 'active',
          current_period_start TIMESTAMP WITH TIME ZONE,
          current_period_end TIMESTAMP WITH TIME ZONE,
          cancel_at_period_end BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS usage_records (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          feature VARCHAR(100) NOT NULL,
          count INTEGER DEFAULT 0,
          reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (user_id, feature)
        )
      `);
      this.logger.log('Subscription tables verified');
    } catch (err) {
      this.logger.warn(`Could not verify subscription tables: ${(err as Error).message}`);
    }
  }

  async getOrCreateSubscription(userId: string, email: string): Promise<Subscription> {
    let subscription = await this.findByUserId(userId);

    if (!subscription) {
      let customerId = `local_${userId}`;

      // Only create Stripe customer if key is configured
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (secretKey) {
        try {
          const customer = await this.stripe.customers.create({ email, metadata: { userId } });
          customerId = customer.id;
        } catch (err) {
          this.logger.warn(
            `Stripe customer creation failed, using local ID: ${(err as Error).message}`,
          );
        }
      }

      const id = uuidv4();
      try {
        await this.db.query(
          `INSERT INTO subscriptions (id, user_id, stripe_customer_id, plan, status, created_at, updated_at)
           VALUES ($1, $2, $3, 'free', 'active', $4, $5)
           ON CONFLICT (user_id) DO NOTHING`,
          [id, userId, customerId, new Date(), new Date()],
        );
      } catch (err) {
        this.logger.warn(
          `Subscription insert failed (may already exist): ${(err as Error).message}`,
        );
      }

      subscription = await this.findByUserId(userId);
    }

    return subscription!;
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    plan: 'monthly' | 'yearly',
  ): Promise<string> {
    const subscription = await this.getOrCreateSubscription(userId, email);

    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const priceId = plan === 'monthly' ? this.monthlyPriceId : this.yearlyPriceId;

    // Check if Stripe is properly configured (not placeholder values)
    const isPlaceholder =
      !secretKey ||
      secretKey.includes('your-') ||
      !priceId ||
      priceId.includes('_id') ||
      priceId.length < 20;

    if (isPlaceholder) {
      throw new BadRequestException(
        'Payment system is not configured yet. All features are currently free!',
      );
    }

    // Verify customer exists in Stripe, recreate if needed
    let customerId = subscription.stripeCustomerId;

    try {
      // Check if customer exists in Stripe
      if (customerId.startsWith('cus_')) {
        try {
          await this.stripe.customers.retrieve(customerId);
        } catch (err) {
          // Customer not found in Stripe, recreate
          this.logger.warn(`Customer ${customerId} not found, recreating`);
          const newCustomer = await this.stripe.customers.create({
            email,
            metadata: { userId },
          });
          customerId = newCustomer.id;
          await this.db.query(
            `UPDATE subscriptions SET stripe_customer_id = $1, updated_at = $2 WHERE user_id = $3`,
            [customerId, new Date(), userId],
          );
        }
      } else if (customerId.startsWith('local_')) {
        // Create new Stripe customer
        const customer = await this.stripe.customers.create({
          email,
          metadata: { userId },
        });
        customerId = customer.id;
        await this.db.query(
          `UPDATE subscriptions SET stripe_customer_id = $1, updated_at = $2 WHERE user_id = $3`,
          [customerId, new Date(), userId],
        );
      }
    } catch (err) {
      this.logger.error(`Stripe customer setup failed: ${(err as Error).message}`);
      throw new BadRequestException('Unable to initialize payment. Please try again.');
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get('FRONTEND_URL')}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/dashboard/subscription`,
      allow_promotion_codes: true,
      metadata: { userId, plan },
    };

    if (plan === 'yearly') {
      sessionParams.subscription_data = { trial_period_days: 7 };
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return session.url!;
  }

  async createPortalSession(userId: string, email: string): Promise<string> {
    const subscription = await this.getOrCreateSubscription(userId, email);

    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new BadRequestException(
        'Payment system is not configured yet. All features are currently free!',
      );
    }

    // If customer ID is a local fallback, create a real Stripe customer first
    let customerId = subscription.stripeCustomerId;
    if (customerId.startsWith('local_')) {
      try {
        const customer = await this.stripe.customers.create({ email, metadata: { userId } });
        customerId = customer.id;
        await this.db.query(
          `UPDATE subscriptions SET stripe_customer_id = $1, updated_at = $2 WHERE user_id = $3`,
          [customerId, new Date(), userId],
        );
      } catch (err) {
        this.logger.error(`Failed to create Stripe customer for portal: ${(err as Error).message}`);
        throw new BadRequestException('Unable to access billing portal. Please try again later.');
      }
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/dashboard/subscription/manage`,
    });

    return session.url;
  }

  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.findByUserId(userId);
    if (!subscription?.stripeSubscriptionId)
      throw new BadRequestException('No active subscription');

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.db.query(
      `UPDATE subscriptions SET cancel_at_period_end = true, updated_at = $1 WHERE user_id = $2`,
      [new Date(), userId],
    );
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscription(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }
  }

  async checkUsage(
    userId: string,
    feature: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const subscription = await this.findByUserId(userId);
    const plan = subscription?.plan || 'free';
    const limit = PLAN_LIMITS[plan][feature as keyof (typeof PLAN_LIMITS)['free']] || 0;

    if (limit === -1) return { allowed: true, remaining: -1 };

    const usage = await this.getUsage(userId, feature);
    const remaining = Math.max(0, limit - usage);

    return { allowed: remaining > 0, remaining };
  }

  async incrementUsage(userId: string, feature: string, amount = 1): Promise<void> {
    const resetAt = new Date();
    resetAt.setDate(1);
    resetAt.setMonth(resetAt.getMonth() + 1);

    await this.db.query(
      `INSERT INTO usage_records (user_id, feature, count, reset_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, feature)
       DO UPDATE SET count = CASE
         WHEN usage_records.reset_at <= NOW() THEN $3
         ELSE usage_records.count + $3
       END,
       reset_at = CASE
         WHEN usage_records.reset_at <= NOW() THEN $4
         ELSE usage_records.reset_at
       END`,
      [userId, feature, amount, resetAt],
    );
  }

  async isPro(userId: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    const plan = subscription?.plan || 'free';
    return plan === 'monthly' || plan === 'yearly';
  }

  async checkAndIncrementUsage(userId: string, feature: string, amount = 1): Promise<void> {
    const { allowed, remaining } = await this.checkUsage(userId, feature);
    if (!allowed || (remaining !== -1 && remaining < amount)) {
      throw new ForbiddenException({
        message: `You've reached your free plan limit for ${feature.replace(/_/g, ' ')}`,
        upgrade: true,
        limit: true,
        feature,
      });
    }
    await this.incrementUsage(userId, feature, amount);
  }

  async checkStorageQuota(userId: string, additionalBytes: number): Promise<void> {
    const subscription = await this.findByUserId(userId);
    const plan = subscription?.plan || 'free';
    const limitBytes = PLAN_LIMITS[plan].storage_bytes;

    // Get current storage usage from documents
    const result = await this.db.queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(file_size), 0) as total FROM documents WHERE user_id = $1`,
      [userId],
    );
    const currentUsage = parseInt(result?.total || '0', 10);

    if (currentUsage + additionalBytes > limitBytes) {
      const limitLabel = plan === 'free' ? '50MB' : '10GB';
      throw new ForbiddenException({
        message: `Storage limit reached (${limitLabel}). Upgrade for more storage.`,
        upgrade: true,
        limit: true,
        feature: 'storage',
      });
    }
  }

  async verifyCheckoutSession(sessionId: string): Promise<{ status: string; plan: string }> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const plan = session.metadata?.plan || 'free';
    const paymentStatus = session.payment_status;

    // Activate the plan in DB (works without webhooks)
    if (session.status === 'complete') {
      await this.handleCheckoutComplete(session);
    }

    return {
      status:
        paymentStatus === 'paid' || paymentStatus === 'no_payment_required'
          ? 'success'
          : paymentStatus === 'unpaid'
            ? 'pending'
            : paymentStatus,
      plan,
    };
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const result = await this.db.queryOne<Subscription>(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [userId],
    );
    return result ? this.mapSubscription(result) : null;
  }

  private async getUsage(userId: string, feature: string): Promise<number> {
    const result = await this.db.queryOne<{ count: string }>(
      `SELECT count FROM usage_records WHERE user_id = $1 AND feature = $2 AND reset_at > NOW()`,
      [userId, feature],
    );
    return parseInt(result?.count || '0', 10);
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as 'monthly' | 'yearly';
    if (!userId) return;

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await this.db.query(
      `UPDATE subscriptions SET
        stripe_subscription_id = $1,
        plan = $2,
        status = 'active',
        current_period_start = $3,
        current_period_end = $4,
        cancel_at_period_end = false,
        updated_at = $5
       WHERE user_id = $6`,
      [
        stripeSubscription.id,
        plan,
        new Date(stripeSubscription.current_period_start * 1000),
        new Date(stripeSubscription.current_period_end * 1000),
        new Date(),
        userId,
      ],
    );

    this.logger.log(`Subscription activated for user ${userId}: ${plan}`);
  }

  private async syncSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
    const stripeStatus = stripeSubscription.status;
    const status =
      stripeStatus === 'active' || stripeStatus === 'trialing'
        ? 'active'
        : stripeStatus === 'canceled'
          ? 'canceled'
          : 'past_due';

    await this.db.query(
      `UPDATE subscriptions SET
        status = $1,
        current_period_start = $2,
        current_period_end = $3,
        cancel_at_period_end = $4,
        updated_at = $5
       WHERE stripe_subscription_id = $6`,
      [
        status,
        new Date(stripeSubscription.current_period_start * 1000),
        new Date(stripeSubscription.current_period_end * 1000),
        stripeSubscription.cancel_at_period_end,
        new Date(),
        stripeSubscription.id,
      ],
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await this.db.query(
        `UPDATE subscriptions SET status = 'past_due', updated_at = $1 WHERE stripe_subscription_id = $2`,
        [new Date(), invoice.subscription],
      );
    }
  }

  private mapSubscription(row: unknown): Subscription {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      stripeCustomerId: r.stripe_customer_id as string,
      stripeSubscriptionId: r.stripe_subscription_id as string | null,
      plan: r.plan as Subscription['plan'],
      status: r.status as Subscription['status'],
      currentPeriodStart: r.current_period_start
        ? new Date(r.current_period_start as string)
        : null,
      currentPeriodEnd: r.current_period_end ? new Date(r.current_period_end as string) : null,
      cancelAtPeriodEnd: r.cancel_at_period_end as boolean,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
