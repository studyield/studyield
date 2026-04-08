import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

@ApiTags('Subscription')
@Controller('subscription')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionService.getOrCreateSubscription(user.sub, user.email);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create checkout session' })
  async createCheckout(
    @CurrentUser() user: JwtPayload,
    @Body() body: { plan: 'monthly' | 'yearly' },
  ) {
    const url = await this.subscriptionService.createCheckoutSession(
      user.sub,
      user.email,
      body.plan,
    );
    return { url };
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create billing portal session' })
  async createPortal(@CurrentUser() user: JwtPayload) {
    const url = await this.subscriptionService.createPortalSession(user.sub, user.email);
    return { url };
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancel(@CurrentUser() user: JwtPayload) {
    await this.subscriptionService.cancelSubscription(user.sub);
    return { message: 'Subscription will be canceled at period end' };
  }

  @Get('verify-session')
  @ApiOperation({ summary: 'Verify checkout session' })
  async verifySession(@Query('session_id') sessionId: string) {
    return this.subscriptionService.verifyCheckoutSession(sessionId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage for all features' })
  async getUsage(@CurrentUser() user: JwtPayload) {
    const features = ['ai_requests', 'study_sets', 'flashcards'];
    const usage: Record<string, { allowed: boolean; remaining: number }> = {};

    for (const feature of features) {
      usage[feature] = await this.subscriptionService.checkUsage(user.sub, feature);
    }

    return usage;
  }
}
