import { Redis } from '@upstash/redis';
import { env } from '../config';

// 创建 Redis 客户端实例
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Redis 键名常量
export const REDIS_KEYS = {
  // WebSocket 连接映射: userToken -> connectionId
  WS_CONNECTION: (userToken: string) => `ws:conn:${userToken}`,
  // WebSocket 连接反向映射: connectionId -> userToken
  WS_CONNECTION_REVERSE: (connectionId: string) => `ws:reverse:${connectionId}`,
  // 通知频道
  NOTIFICATION_CHANNEL: 'notifications',
  // 用户在线状态
  USER_ONLINE: (userToken: string) => `user:online:${userToken}`,
} as const;

// Redis 操作工具函数
export class RedisManager {
  /**
   * 注册 WebSocket 连接
   */
  static async registerConnection(userToken: string, connectionId: string): Promise<void> {
    const pipeline = redis.pipeline();
    
    // 设置用户token到连接ID的映射
    pipeline.set(REDIS_KEYS.WS_CONNECTION(userToken), connectionId, { ex: 3600 }); // 1小时过期
    
    // 设置连接ID到用户token的反向映射
    pipeline.set(REDIS_KEYS.WS_CONNECTION_REVERSE(connectionId), userToken, { ex: 3600 });
    
    // 设置用户在线状态
    pipeline.set(REDIS_KEYS.USER_ONLINE(userToken), '1', { ex: 3600 });
    
    await pipeline.exec();
  }

  /**
   * 注销 WebSocket 连接
   */
  static async unregisterConnection(connectionId: string): Promise<void> {
    // 先获取用户token
    const userToken = await redis.get<string>(REDIS_KEYS.WS_CONNECTION_REVERSE(connectionId));
    
    if (userToken) {
      const pipeline = redis.pipeline();
      
      // 删除所有相关映射
      pipeline.del(REDIS_KEYS.WS_CONNECTION(userToken));
      pipeline.del(REDIS_KEYS.WS_CONNECTION_REVERSE(connectionId));
      pipeline.del(REDIS_KEYS.USER_ONLINE(userToken));
      
      await pipeline.exec();
    }
  }

  /**
   * 获取用户的连接ID
   */
  static async getConnectionId(userToken: string): Promise<string | null> {
    return await redis.get(REDIS_KEYS.WS_CONNECTION(userToken));
  }

  /**
   * 获取连接对应的用户token
   */
  static async getUserToken(connectionId: string): Promise<string | null> {
    return await redis.get(REDIS_KEYS.WS_CONNECTION_REVERSE(connectionId));
  }

  /**
   * 检查用户是否在线
   */
  static async isUserOnline(userToken: string): Promise<boolean> {
    const result = await redis.get(REDIS_KEYS.USER_ONLINE(userToken));
    return result === '1';
  }

  /**
   * 发布通知消息
   */
  static async publishNotification(message: any): Promise<void> {
    await redis.publish(REDIS_KEYS.NOTIFICATION_CHANNEL, JSON.stringify(message));
  }

  /**
   * 清理过期连接（定期清理任务）
   */
  static async cleanupExpiredConnections(): Promise<void> {
    // 这个方法可以在定时任务中调用，清理可能的僵尸连接
    // 由于我们设置了过期时间，Redis会自动清理，这里主要是备用
  }
}

// 导出类型定义
export interface NotificationMessage {
  type: 'new_comment' | 'comment_reply' | 'comment_approved' | 'comment_rejected';
  targetUserToken?: string; // 如果指定，只发送给特定用户
  data: {
    commentId: string;
    siteId: string;
    pageIdentifier: string;
    content?: string;
    authorNickname?: string;
    parentId?: string;
  };
  timestamp: string;
}