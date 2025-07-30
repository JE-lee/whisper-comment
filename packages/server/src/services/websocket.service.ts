import { FastifyInstance } from 'fastify';
import { RedisManager, NotificationMessage, REDIS_KEYS, redis } from '../lib/redis';
import { v4 as uuidv4 } from 'uuid';

// WebSocket 连接管理器
class WebSocketManager {
  private connections = new Map<string, any>();
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.setupNotificationSubscriber();
  }

  /**
   * 设置 Redis 通知订阅
   */
  private async setupNotificationSubscriber() {
    try {
      // 订阅通知频道
      await redis.subscribe(REDIS_KEYS.NOTIFICATION_CHANNEL);
      
      // 监听消息 - 使用轮询方式检查通知
      // 注意：Upstash Redis 不支持传统的 pub/sub 事件监听
      // 这里可以考虑使用其他方式实现实时通知
      
      this.fastify.log.info('WebSocket notification subscriber setup completed');
    } catch (error) {
      this.fastify.log.error('Failed to setup notification subscriber:', error);
    }
  }

  /**
   * 处理通知消息
   */
  private async handleNotification(notification: NotificationMessage) {
    try {
      if (notification.targetUserToken) {
        // 发送给特定用户
        await this.sendToUser(notification.targetUserToken, notification);
      } else {
        // 广播给所有在线用户（根据页面标识符过滤）
        await this.broadcastToPage(notification.data.pageIdentifier, notification);
      }
    } catch (error) {
      this.fastify.log.error('Failed to handle notification:', error);
    }
  }

  /**
   * 发送消息给特定用户
   */
  private async sendToUser(userToken: string, message: any) {
    const connectionId = await RedisManager.getConnectionId(userToken);
    if (connectionId && this.connections.has(connectionId)) {
      const socket = this.connections.get(connectionId)!;
      try {
        socket.socket.send(JSON.stringify(message));
      } catch (error) {
        this.fastify.log.error(`Failed to send message to user ${userToken}:`, error);
        // 连接可能已断开，清理连接
        if (connectionId) {
          await this.removeConnection(connectionId);
        }
      }
    }
  }

  /**
   * 广播消息给页面上的所有用户
   */
  private async broadcastToPage(pageIdentifier: string, message: any) {
    // 遍历所有连接，发送给相关页面的用户
    for (const [connectionId, socket] of this.connections) {
      try {
        // 这里可以根据需要添加页面过滤逻辑
        // 目前简单广播给所有连接的用户
        socket.socket.send(JSON.stringify(message));
      } catch (error) {
        this.fastify.log.error(`Failed to broadcast to connection ${connectionId}:`, error);
        // 连接可能已断开，清理连接
        if (connectionId) {
          await this.removeConnection(connectionId);
        }
      }
    }
  }

  /**
   * 添加新连接
   */
  async addConnection(userToken: string, socket: any): Promise<string> {
    const connectionId = uuidv4();
    
    // 存储连接
    this.connections.set(connectionId, socket);
    
    // 在 Redis 中注册连接
    await RedisManager.registerConnection(userToken, connectionId);
    
    this.fastify.log.info(`WebSocket connection added: ${connectionId} for user: ${userToken}`);
    
    return connectionId;
  }

  /**
   * 移除连接
   */
  async removeConnection(connectionId: string) {
    // 从本地连接池中移除
    this.connections.delete(connectionId);
    
    // 从 Redis 中注销连接
    await RedisManager.unregisterConnection(connectionId);
    
    this.fastify.log.info(`WebSocket connection removed: ${connectionId}`);
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

// 全局 WebSocket 管理器实例
let wsManager: WebSocketManager;

/**
 * 注册 WebSocket 路由和处理器
 */
export async function registerWebSocketRoutes(fastify: FastifyInstance) {
  // 注册 WebSocket 插件
  await fastify.register(require('@fastify/websocket'));
  
  // 创建 WebSocket 管理器
  wsManager = new WebSocketManager(fastify);
  
  // WebSocket 路由
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true } as any, async (connection: any) => {
      const { socket } = connection;
      let connectionId: string | null = null;
      let userToken: string | null = null;
      
      fastify.log.info('New WebSocket connection established');
      
      // 监听消息
      socket.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'auth' && data.userToken) {
            // 用户认证
            userToken = data.userToken;
            if (userToken) {
              connectionId = await wsManager.addConnection(userToken, connection);
            }
            
            // 发送认证成功消息
            socket.send(JSON.stringify({
              type: 'auth_success',
              connectionId,
              timestamp: new Date().toISOString()
            }));
            
            fastify.log.info(`User authenticated: ${userToken}`);
          } else if (data.type === 'ping') {
            // 心跳检测
            socket.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          } else {
            fastify.log.warn('Unknown message type:', data.type);
          }
        } catch (error) {
          fastify.log.error('Failed to process WebSocket message:', error);
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      // 监听连接关闭
      socket.on('close', async () => {
        if (connectionId) {
          await wsManager.removeConnection(connectionId);
        }
        fastify.log.info(`WebSocket connection closed${connectionId ? ` for connection: ${connectionId}` : ''}`);
      });
      
      // 监听错误
      socket.on('error', async (error: any) => {
        fastify.log.error('WebSocket error:', error);
        if (connectionId) {
          await wsManager.removeConnection(connectionId);
        }
      });
    });
    
    // WebSocket 状态查询端点
    fastify.get('/ws/status', async (request, reply) => {
      return reply.success({
        connections: wsManager.getConnectionCount(),
        status: 'running'
      });
    });
  });
}

/**
 * 获取 WebSocket 管理器实例
 */
export function getWebSocketManager(): WebSocketManager {
  return wsManager;
}

/**
 * 发送通知的便捷函数
 */
export async function sendNotification(notification: NotificationMessage) {
  await RedisManager.publishNotification(notification);
}