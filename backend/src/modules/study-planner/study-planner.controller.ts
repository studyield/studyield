import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { StudyPlannerService } from './study-planner.service';

@ApiTags('Study Planner')
@Controller('study-planner')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudyPlannerController {
  constructor(private readonly studyPlannerService: StudyPlannerService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming flashcard reviews' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look ahead (default 14)' })
  @ApiResponse({ status: 200, description: 'Upcoming reviews grouped by date' })
  async getUpcomingReviews(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 14;
    return this.studyPlannerService.getUpcomingReviews(user.sub, numDays);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily study plan' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Date in YYYY-MM-DD format (default today)' })
  @ApiResponse({ status: 200, description: 'Daily study plan with prioritized items' })
  async getDailyPlan(
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
  ) {
    const planDate = date || new Date().toISOString().split('T')[0];
    return this.studyPlannerService.getDailyPlan(user.sub, planDate);
  }

  @Post('exam-date')
  @ApiOperation({ summary: 'Set an exam date for a study set' })
  @ApiResponse({ status: 201, description: 'Exam date set' })
  async setExamDate(
    @CurrentUser() user: JwtPayload,
    @Body() body: { studySetId: string; examDate: string },
  ) {
    return this.studyPlannerService.setExamDate(
      user.sub,
      body.studySetId,
      body.examDate,
    );
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get study streak and heatmap data' })
  @ApiResponse({ status: 200, description: 'Current streak, longest streak, and 90-day heatmap' })
  async getStudyStreak(@CurrentUser() user: JwtPayload) {
    return this.studyPlannerService.getStudyStreak(user.sub);
  }

  @Get('export/ical')
  @ApiOperation({ summary: 'Export study schedule as iCal file' })
  @ApiResponse({ status: 200, description: 'iCal file content' })
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="studyield-schedule.ics"')
  async exportIcal(@CurrentUser() user: JwtPayload) {
    return this.studyPlannerService.exportToIcal(user.sub);
  }
}
