import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_FEATURE_KEY, PlanFeatureMeta } from '../decorators/plan-feature.decorator';
import { SubscriptionService } from '../../modules/subscription/subscription.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<PlanFeatureMeta>(PLAN_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @PlanFeature metadata → endpoint is not gated
    if (!meta) {
      return true;
    }

    // Determine user ID based on context type (HTTP or WS)
    let userId: string | undefined;

    const ctxType = context.getType();
    if (ctxType === 'http') {
      const request = context.switchToHttp().getRequest();
      userId = request.user?.sub;
    } else if (ctxType === 'ws') {
      const client = context.switchToWs().getClient();
      userId = client.data?.user?.sub;
    }

    if (!userId) {
      throw new ForbiddenException({
        message: 'Authentication required',
        upgrade: false,
      });
    }

    const isPro = await this.subscriptionService.isPro(userId);
    if (isPro) {
      return true;
    }

    throw new ForbiddenException({
      message: `This feature requires a Pro plan`,
      upgrade: true,
      feature: meta.feature,
    });
  }
}
