import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PushService } from '../services/push.service';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  PushSubscribeRequestSchema,
  PushUnsubscribeRequestSchema,
  VapidPublicKeyResponseSchema,
  PushSubscriptionResponseSchema,
  PushErrorResponseSchema,
  PushSubscriptionStatusResponseSchema
} from '../schemas/push.schema';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    token: string;
    [key: string]: any;
  };
}

export async function pushRoutes(fastify: FastifyInstance) {
  // Get VAPID public key (no authentication required)
  fastify.get('/vapid-public-key', {
    schema: {
      response: {
        200: VapidPublicKeyResponseSchema,
        500: PushErrorResponseSchema
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const publicKey = PushService.getVapidPublicKey();
      return reply.code(200).send({ publicKey });
    } catch (error) {
      fastify.log.error('Error getting VAPID public key:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get VAPID public key',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Subscribe to push notifications
  fastify.post('/subscribe', {
    preHandler: authenticateToken,
    schema: {
      body: PushSubscribeRequestSchema,
      response: {
        200: PushSubscriptionResponseSchema,
        400: PushErrorResponseSchema,
        401: PushErrorResponseSchema,
        500: PushErrorResponseSchema
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.token) {
        return reply.code(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      const { subscription } = request.body as {
        subscription: {
          endpoint: string;
          keys: {
            p256dh: string;
            auth: string;
          };
        };
      };
      
      // Validate subscription data
      if (!subscription.endpoint || !subscription.keys.p256dh || !subscription.keys.auth) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid subscription data'
        });
      }

      await PushService.subscribe(request.user.token, subscription);
      
      return reply.code(200).send({
        success: true,
        message: 'Successfully subscribed to push notifications'
      });
    } catch (error) {
      fastify.log.error('Error subscribing to push notifications:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to subscribe to push notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Unsubscribe from push notifications
  fastify.post('/unsubscribe', {
    preHandler: authenticateToken,
    schema: {
      body: PushUnsubscribeRequestSchema,
      response: {
        200: PushSubscriptionResponseSchema,
        401: PushErrorResponseSchema,
        500: PushErrorResponseSchema
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.token) {
        return reply.code(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      const { endpoint } = request.body as { endpoint?: string; };
      
      await PushService.unsubscribe(request.user.token, endpoint);
      
      return reply.code(200).send({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });
    } catch (error) {
      fastify.log.error('Error unsubscribing from push notifications:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to unsubscribe from push notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get push subscription status
  fastify.get('/subscription-status', {
    preHandler: authenticateToken,
    schema: {
      response: {
        200: PushSubscriptionStatusResponseSchema,
        401: PushErrorResponseSchema,
        500: PushErrorResponseSchema
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.token) {
        return reply.code(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      const subscriptionsCount = await PushService.getUserSubscriptionsCount(request.user.token);
      
      return reply.code(200).send({
        subscribed: subscriptionsCount > 0,
        subscriptionsCount
      });
    } catch (error) {
      fastify.log.error('Error getting subscription status:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get subscription status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Send test notification
  fastify.post('/test', {
    preHandler: authenticateToken,
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          icon: { type: 'string' }
        },
        required: ['title', 'body']
      },
      response: {
        200: PushSubscriptionResponseSchema,
        400: PushErrorResponseSchema,
        401: PushErrorResponseSchema,
        500: PushErrorResponseSchema
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.token) {
        return reply.code(401).send({
          success: false,
          message: 'Authentication required'
        });
      }

      const { title, body, icon } = request.body as {
        title: string;
        body: string;
        icon?: string;
      };

      await PushService.sendToUser(request.user.token, {
        title,
        body,
        icon: icon || '/icon-192x192.png'
      });

      return reply.code(200).send({
        success: true,
        message: 'Test notification sent successfully'
      });
    } catch (error) {
      fastify.log.error('Error sending test notification:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to send test notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}