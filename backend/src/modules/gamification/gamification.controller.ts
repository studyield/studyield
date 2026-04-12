import { Controller, Get, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { GamificationService } from './gamification.service';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get my gamification profile (XP, level, streak, achievements)' })
  @ApiResponse({ status: 200, description: 'Gamification profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getProfile(user.sub);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'all-time'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Leaderboard entries' })
  async getLeaderboard(
    @Query('period', new DefaultValuePipe('weekly')) period: 'weekly' | 'monthly' | 'all-time',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.gamificationService.getLeaderboard(period, limit);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get all achievements with my progress' })
  @ApiResponse({ status: 200, description: 'Achievement progress list' })
  async getAchievements(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getAchievementProgress(user.sub);
  }
}
