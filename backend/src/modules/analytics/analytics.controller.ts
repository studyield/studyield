import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, Public, PlanFeature } from '../../common';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me')
  @PlanFeature('advanced_analytics') // Removed for development testing
  @ApiOperation({ summary: 'Get user analytics' })
  async getUserAnalytics(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getUserAnalytics(user.sub);
  }

  @Get('me/activity')
  // @PlanFeature('advanced_analytics') // Removed for development testing
  @ApiOperation({ summary: 'Get study activity' })
  async getActivity(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getStudyActivity(user.sub);
  }

  @Get('me/performance')
  // @PlanFeature('advanced_analytics') // Removed for development testing
  @ApiOperation({ summary: 'Get performance metrics' })
  async getPerformance(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getPerformanceMetrics(user.sub);
  }

  @Post('track')
  @ApiOperation({ summary: 'Track an event' })
  async trackEvent(
    @CurrentUser() user: JwtPayload,
    @Body() body: { eventType: string; metadata?: Record<string, unknown> },
  ) {
    await this.analyticsService.trackEvent(user.sub, body.eventType, body.metadata);
    return { tracked: true };
  }

  @Public()
  @Get('global')
  @ApiOperation({ summary: 'Get global stats' })
  async getGlobalStats() {
    return this.analyticsService.getGlobalStats();
  }
}
