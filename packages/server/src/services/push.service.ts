import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

const prisma = new PrismaClient();

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys are required for push notifications');
}

// Configure web-push with VAPID details
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushService {
  /**
   * Get VAPID public key for client subscription
   */
  static getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY!;
  }

  /**
   * Subscribe user to push notifications
   */
  static async subscribe(
    userToken: string,
    subscription: PushSubscriptionData
  ): Promise<void> {
    try {
      // Check if subscription already exists
      const existingSubscription = await prisma.pushSubscription.findUnique({
        where: {
          userToken_endpoint: {
            userToken,
            endpoint: subscription.endpoint
          }
        }
      });

      if (existingSubscription) {
        // Update existing subscription
        await prisma.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        });
      } else {
        // Create new subscription
        await prisma.pushSubscription.create({
          data: {
            userToken,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        });
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw new Error('Failed to subscribe to push notifications');
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  static async unsubscribe(
    userToken: string,
    endpoint?: string
  ): Promise<void> {
    try {
      if (endpoint) {
        // Remove specific subscription
        await prisma.pushSubscription.deleteMany({
          where: {
            userToken,
            endpoint
          }
        });
      } else {
        // Remove all subscriptions for user
        await prisma.pushSubscription.deleteMany({
          where: { userToken }
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error('Failed to unsubscribe from push notifications');
    }
  }

  /**
   * Send push notification to specific user
   */
  static async sendToUser(
    userToken: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      // Get all subscriptions for the user
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userToken }
      });

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user: ${userToken}`);
        return;
      }

      // Send notification to all user's subscriptions
      const sendPromises = subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );
          console.log(`Push notification sent to ${subscription.endpoint}`);
        } catch (error: any) {
          console.error(`Failed to send push notification to ${subscription.endpoint}:`, error);
          
          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id }
            });
            console.log(`Removed invalid subscription: ${subscription.endpoint}`);
          }
        }
      });

      await Promise.allSettled(sendPromises);
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      throw new Error('Failed to send push notification');
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(
    userTokens: string[],
    payload: PushNotificationPayload
  ): Promise<void> {
    const sendPromises = userTokens.map(userToken => 
      this.sendToUser(userToken, payload)
    );
    
    await Promise.allSettled(sendPromises);
  }

  /**
   * Get user's push subscriptions count
   */
  static async getUserSubscriptionsCount(userToken: string): Promise<number> {
    try {
      return await prisma.pushSubscription.count({
        where: { userToken }
      });
    } catch (error) {
      console.error('Error getting user subscriptions count:', error);
      return 0;
    }
  }

  /**
   * Clean up expired or invalid subscriptions
   */
  static async cleanupSubscriptions(): Promise<void> {
    try {
      // Remove subscriptions older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await prisma.pushSubscription.deleteMany({
        where: {
          updatedAt: {
            lt: ninetyDaysAgo
          }
        }
      });

      console.log(`Cleaned up ${result.count} expired push subscriptions`);
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error);
    }
  }
}

export default PushService;