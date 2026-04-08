import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { FirebaseService } from '../firebase/firebase.service';
import { AppGateway } from '../../common/gateways/app.gateway';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  studyReminders: boolean;
  weeklyDigest: boolean;
  achievementAlerts: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly firebase: FirebaseService,
    private readonly appGateway: AppGateway,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const id = uuidv4();
    const result = await this.db.queryOne<Notification>(
      `INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7)
       RETURNING *`,
      [id, dto.userId, dto.type, dto.title, dto.message, dto.link || null, new Date()],
    );

    // Send real-time notification via WebSocket
    this.appGateway.notifyUser(dto.userId, {
      type: dto.type,
      title: dto.title,
      message: dto.message,
      id,
      link: dto.link || null,
      createdAt: new Date().toISOString(),
    });

    // Send push notification
    await this.sendPushNotification(dto.userId, dto.title, dto.message, {
      notificationId: id,
      type: dto.type,
    });

    this.logger.debug(`Notification created for user ${dto.userId}: ${dto.title}`);
    return this.mapNotification(result!);
  }

  async createBulk(notifications: CreateNotificationDto[]): Promise<void> {
    for (const dto of notifications) {
      await this.create(dto);
    }
  }

  async getByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const offset = (page - 1) * limit;

    const [results, countResult, unreadResult] = await Promise.all([
      this.db.queryMany<Notification>(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
        [userId],
      ),
      this.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId],
      ),
    ]);

    return {
      data: results.map((r) => this.mapNotification(r)),
      total: parseInt(countResult?.count || '0', 10),
      unreadCount: parseInt(unreadResult?.count || '0', 10),
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId],
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await this.db.queryOne<NotificationPreferences>(
      'SELECT preferences FROM users WHERE id = $1',
      [userId],
    );

    const prefs = result as unknown as Record<string, unknown>;
    const preferences = prefs?.preferences
      ? typeof prefs.preferences === 'string'
        ? JSON.parse(prefs.preferences)
        : prefs.preferences
      : {};

    return {
      email: preferences.notifications?.email ?? true,
      push: preferences.notifications?.push ?? true,
      inApp: preferences.notifications?.inApp ?? true,
      studyReminders: preferences.notifications?.studyReminders ?? true,
      weeklyDigest: preferences.notifications?.weeklyDigest ?? true,
      achievementAlerts: preferences.notifications?.achievementAlerts ?? true,
    };
  }

  async updatePreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...prefs };

    await this.db.query(
      `UPDATE users SET preferences = jsonb_set(COALESCE(preferences, '{}')::jsonb, '{notifications}', $1::jsonb) WHERE id = $2`,
      [JSON.stringify(updated), userId],
    );

    return updated;
  }

  async sendStudyReminder(userId: string): Promise<void> {
    await this.create({
      userId,
      type: 'reminder',
      title: 'Time to study!',
      message: "Don't break your streak! Review some flashcards today.",
      link: '/study',
    });
  }

  async sendAchievementNotification(userId: string, achievement: string): Promise<void> {
    await this.create({
      userId,
      type: 'success',
      title: 'Achievement Unlocked!',
      message: achievement,
      link: '/achievements',
    });
  }

  async registerFCMToken(userId: string, fcmToken: string, platform: string): Promise<void> {
    try {
      // Check if token already exists
      const existing = await this.db.queryOne(
        'SELECT id FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2',
        [userId, fcmToken],
      );

      if (existing) {
        // Update last_used timestamp
        await this.db.query(
          'UPDATE user_fcm_tokens SET last_used = $1 WHERE user_id = $2 AND fcm_token = $3',
          [new Date(), userId, fcmToken],
        );
      } else {
        // Insert new token
        await this.db.query(
          `INSERT INTO user_fcm_tokens (id, user_id, fcm_token, platform, created_at, last_used)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), userId, fcmToken, platform, new Date(), new Date()],
        );
      }

      this.logger.debug(`FCM token registered for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error registering FCM token: ${error.message}`);
    }
  }

  async unregisterFCMToken(userId: string, fcmToken: string): Promise<void> {
    try {
      await this.db.query('DELETE FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2', [
        userId,
        fcmToken,
      ]);
      this.logger.debug(`FCM token unregistered for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error unregistering FCM token: ${error.message}`);
    }
  }

  async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const results = await this.db.queryMany<{ fcm_token: string }>(
        'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1',
        [userId],
      );
      return results.map((r) => r.fcm_token);
    } catch (error) {
      this.logger.error(`Error fetching FCM tokens: ${error.message}`);
      return [];
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      // Get user's notification preferences
      const prefs = await this.getPreferences(userId);
      if (!prefs.push) {
        this.logger.debug(`Push notifications disabled for user ${userId}`);
        return;
      }

      // Get user's FCM tokens
      const tokens = await this.getUserFCMTokens(userId);
      if (tokens.length === 0) {
        this.logger.debug(`No FCM tokens found for user ${userId}`);
        return;
      }

      // Send push notification to all user's devices
      const successCount = await this.firebase.sendToMultipleDevices(tokens, title, body, data);
      this.logger.debug(
        `Sent push notification to ${successCount}/${tokens.length} devices for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`);
    }
  }

  private mapNotification(row: unknown): Notification {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      type: r.type as Notification['type'],
      title: r.title as string,
      message: r.message as string,
      link: r.link as string | null,
      isRead: r.is_read as boolean,
      createdAt: new Date(r.created_at as string),
    };
  }
}
