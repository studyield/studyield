import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import Stripe from 'stripe';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { Public } from '../../common';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    });
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  @Public()
  @Post('stripe')
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody, signature, this.webhookSecret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    await this.subscriptionService.handleWebhook(event);

    return { received: true };
  }
}
