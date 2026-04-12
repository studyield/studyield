import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import {
  StudyGroupsService,
  CreateStudyGroupDto,
  ShareStudySetDto,
} from './study-groups.service';

@ApiTags('Study Groups')
@Controller('study-groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudyGroupsController {
  constructor(private readonly studyGroupsService: StudyGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new study group' })
  @ApiResponse({ status: 201, description: 'Study group created' })
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStudyGroupDto,
  ) {
    return this.studyGroupsService.createGroup(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my study groups' })
  @ApiResponse({ status: 200, description: 'List of study groups' })
  async listGroups(@CurrentUser() user: JwtPayload) {
    return this.studyGroupsService.listGroups(user.sub);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a study group via invite code' })
  @ApiResponse({ status: 200, description: 'Joined study group' })
  async joinGroup(
    @CurrentUser() user: JwtPayload,
    @Body('inviteCode') inviteCode: string,
  ) {
    return this.studyGroupsService.joinGroup(user.sub, inviteCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get study group details' })
  @ApiResponse({ status: 200, description: 'Study group details' })
  async getGroupDetails(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.studyGroupsService.getGroupDetails(user.sub, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get study group members' })
  @ApiResponse({ status: 200, description: 'List of group members' })
  async getGroupMembers(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.studyGroupsService.getGroupMembers(user.sub, id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a study set with the group' })
  @ApiResponse({ status: 201, description: 'Study set shared' })
  async shareStudySet(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareStudySetDto,
  ) {
    return this.studyGroupsService.shareStudySet(user.sub, id, dto);
  }

  @Get(':id/study-sets')
  @ApiOperation({ summary: 'Get study sets shared with the group' })
  @ApiResponse({ status: 200, description: 'List of shared study sets' })
  async getGroupStudySets(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.studyGroupsService.getGroupStudySets(user.sub, id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get group activity feed' })
  @ApiResponse({ status: 200, description: 'Activity feed' })
  async getGroupActivity(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.studyGroupsService.getGroupActivity(user.sub, id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a study group' })
  @ApiResponse({ status: 200, description: 'Left the group' })
  async leaveGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.studyGroupsService.leaveGroup(user.sub, id);
    return { message: 'Successfully left the group' };
  }
}
