import { Type } from '@sinclair/typebox';

// Push subscription request schema
export const PushSubscribeRequestSchema = Type.Object({
  subscription: Type.Object({
    endpoint: Type.String(),
    keys: Type.Object({
      p256dh: Type.String(),
      auth: Type.String()
    })
  })
});

// Push unsubscribe request schema
export const PushUnsubscribeRequestSchema = Type.Object({
  endpoint: Type.Optional(Type.String())
});

// VAPID public key response schema
export const VapidPublicKeyResponseSchema = Type.Object({
  publicKey: Type.String()
});

// Push subscription response schema
export const PushSubscriptionResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String()
});

// Push notification payload schema (for internal use)
export const PushNotificationPayloadSchema = Type.Object({
  title: Type.String(),
  body: Type.String(),
  icon: Type.Optional(Type.String()),
  badge: Type.Optional(Type.String()),
  data: Type.Optional(Type.Any()),
  actions: Type.Optional(Type.Array(Type.Object({
    action: Type.String(),
    title: Type.String(),
    icon: Type.Optional(Type.String())
  })))
});

// Error response schema
export const PushErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  message: Type.String(),
  error: Type.Optional(Type.String())
});

// Push subscription status response schema
export const PushSubscriptionStatusResponseSchema = Type.Object({
  subscribed: Type.Boolean(),
  subscriptionsCount: Type.Number()
});