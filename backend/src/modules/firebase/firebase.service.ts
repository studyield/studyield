import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'); // Replace escaped newlines
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase credentials not configured. Push notifications will not work.');
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      this.logger.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`✅ Push notification sent: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send push notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.debug(`✅ Sent ${response.successCount}/${fcmTokens.length} push notifications`);
      return response.successCount;
    } catch (error) {
      this.logger.error(`❌ Failed to send multicast push notification: ${error.message}`);
      return 0;
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`✅ Push notification sent to topic ${topic}: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send push notification to topic: ${error.message}`);
      return false;
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(fcmTokens: string[], topic: string): Promise<boolean> {
    try {
      await admin.messaging().subscribeToTopic(fcmTokens, topic);
      this.logger.debug(`✅ Subscribed ${fcmTokens.length} devices to topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to topic: ${error.message}`);
      return false;
    }
  }
}
