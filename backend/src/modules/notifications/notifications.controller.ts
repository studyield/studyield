import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, NotificationPreferences } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  async getNotifications(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.notificationsService.getByUser(user.sub, pagination.page, pagination.limit);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, user.sub);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllAsRead(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.notificationsService.delete(id, user.sub);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all notifications' })
  async deleteAll(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.deleteAll(user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() prefs: Partial<NotificationPreferences>,
  ) {
    return this.notificationsService.updatePreferences(user.sub, prefs);
  }

  @Post('register-device')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register FCM token for push notifications' })
  async registerDevice(
    @CurrentUser() user: JwtPayload,
    @Body() body: { fcmToken: string; platform: string },
  ) {
    await this.notificationsService.registerFCMToken(user.sub, body.fcmToken, body.platform);
  }

  @Post('unregister-device')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister FCM token' })
  async unregisterDevice(@CurrentUser() user: JwtPayload, @Body() body: { fcmToken: string }) {
    await this.notificationsService.unregisterFCMToken(user.sub, body.fcmToken);
  }

  @Post('test-push')
  @ApiOperation({ summary: 'Send test push notification (for testing)' })
  async testPush(
    @CurrentUser() user: JwtPayload,
    @Body() body?: { title?: string; message?: string },
  ) {
    const title = body?.title || 'Test Notification';
    const message = body?.message || 'This is a test push notification from Studyield!';

    // Create notification (this will save to DB + send WebSocket + send Push)
    const notification = await this.notificationsService.create({
      userId: user.sub,
      type: 'info',
      title,
      message,
    });

    return {
      success: true,
      message: 'Test notification sent!',
      notification,
    };
  }
}
