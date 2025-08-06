import { NotificationMessage, RedisManager } from '../lib/redis';
import { sendNotification } from './websocket.service';
import { PushService, PushNotificationPayload } from './push.service';

/**
 * 通知服务类
 * 负责处理各种评论相关的通知逻辑
 */
export class NotificationService {
  /**
   * 发送新评论通知（已废弃，不再使用）
   * @param _commentData 评论数据
   * @deprecated 根据新需求，创建新评论时不再发送通知
   */
  static async sendNewCommentNotification(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _commentData: {
      commentId: string;
      siteId: string;
      pageIdentifier: string;
      content: string;
      authorNickname: string;
      authorToken: string;
      parentId?: string;
    }
  ) {
    // 不再发送新评论通知
    console.log('New comment notification disabled by design');
  }

  /**
   * 发送评论回复通知
   * @param replyData 回复数据
   */
  static async sendCommentReplyNotification(
    replyData: {
      commentId: string;
      siteId: string;
      pageIdentifier: string;
      content: string;
      authorNickname: string;
      authorToken: string;
      parentId?: string;
    }
  ) {


    // 查询父评论，获取原评论作者的userToken
    let parentCommentAuthorToken: string | null = null;
    
    if (replyData.parentId) {
      try {
        // 这里需要注入 CommentRepository 实例
        // 由于这是静态方法，我们需要通过其他方式获取 repository
        // 暂时通过直接查询数据库的方式实现
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const parentComment = await prisma.comment.findUnique({
          where: { commentId: replyData.parentId },
          select: { authorToken: true }
        });
        
        if (parentComment) {
          parentCommentAuthorToken = parentComment.authorToken;
          
        } else {
          console.log('[NotificationService] 未找到父评论:', replyData.parentId);
        }
        
        await prisma.$disconnect();
      } catch (error) {
        console.error('[NotificationService] 查询父评论失败:', error);
      }
    } else {
      console.log('[NotificationService] 没有parentId，跳过通知发送');
    }

    const notification: NotificationMessage = {
      type: 'comment_reply',
      data: {
        commentId: replyData.commentId,
        siteId: replyData.siteId,
        pageIdentifier: replyData.pageIdentifier,
        content: replyData.content,
        authorNickname: replyData.authorNickname,
        parentId: replyData.parentId,
      },
      timestamp: new Date().toISOString(),
    };

    // 只有找到了父评论作者，且不是自己回复自己，才发送定向通知
    if (parentCommentAuthorToken && parentCommentAuthorToken !== replyData.authorToken) {
      notification.targetUserToken = parentCommentAuthorToken;

      
      try {
        // 检查用户是否在线（暂时不做限制，离线用户也发送通知）
        const isOnline = await RedisManager.isUserOnline(parentCommentAuthorToken);

        // 发送 WebSocket 通知
        await sendNotification(notification);
        console.log('[NotificationService] WebSocket 通知已发送');

        // 如果用户不在线，发送推送通知
        if (!isOnline) {
          const pushPayload: PushNotificationPayload = {
            title: '新的评论回复',
            body: `${replyData.authorNickname} 回复了您的评论`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              type: 'comment_reply',
              commentId: replyData.commentId,
              siteId: replyData.siteId,
              pageIdentifier: replyData.pageIdentifier,
              parentId: replyData.parentId,
              url: `${replyData.pageIdentifier}#comment-${replyData.commentId}`
            },
            actions: [
              {
                action: 'view',
                title: '查看回复',
                icon: '/action-view.png'
              },
              {
                action: 'dismiss',
                title: '忽略'
              }
            ]
          };

          try {
            await PushService.sendToUser(parentCommentAuthorToken, pushPayload);
            console.log('[NotificationService] 推送通知已发送');
          } catch (pushError) {
            console.error('[NotificationService] 推送通知发送失败:', pushError);
            // 推送失败不影响主流程，继续执行
          }
        } else {
          console.log('[NotificationService] 用户在线，跳过推送通知');
        }

      } catch (error) {
        console.error('[NotificationService] 通知发送失败:', {
          targetUserToken: parentCommentAuthorToken,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } else {
      if (!parentCommentAuthorToken) {
        console.log('[NotificationService] 未找到父评论作者，跳过通知发送:', {
          parentId: replyData.parentId,
          replyAuthor: replyData.authorNickname
        });
      } else if (parentCommentAuthorToken === replyData.authorToken) {
        console.log('[NotificationService] 用户回复自己的评论，跳过通知发送:', {
          userToken: replyData.authorToken,
          authorNickname: replyData.authorNickname
        });
      }
    }
  }

  /**
   * 发送评论审核通过通知
   * @param commentData 评论数据
   */
  static async sendCommentApprovedNotification(
    commentData: {
      commentId: string;
      siteId: string;
      pageIdentifier: string;
      authorToken: string;
      authorNickname: string;
    }
  ) {
    const notification: NotificationMessage = {
      type: 'comment_approved',
      targetUserToken: commentData.authorToken,
      data: {
        commentId: commentData.commentId,
        siteId: commentData.siteId,
        pageIdentifier: commentData.pageIdentifier,
        authorNickname: commentData.authorNickname,
      },
      timestamp: new Date().toISOString(),
    };

    await sendNotification(notification);
  }

  /**
   * 发送评论审核拒绝通知
   * @param commentData 评论数据
   */
  static async sendCommentRejectedNotification(
    commentData: {
      commentId: string;
      siteId: string;
      pageIdentifier: string;
      authorToken: string;
      authorNickname: string;
      reason?: string;
    }
  ) {
    const notification: NotificationMessage = {
      type: 'comment_rejected',
      targetUserToken: commentData.authorToken,
      data: {
        commentId: commentData.commentId,
        siteId: commentData.siteId,
        pageIdentifier: commentData.pageIdentifier,
        authorNickname: commentData.authorNickname,
      },
      timestamp: new Date().toISOString(),
    };

    await sendNotification(notification);
  }

  /**
   * 检查用户是否在线
   * @param userToken 用户token
   */
  static async isUserOnline(userToken: string): Promise<boolean> {
    return await RedisManager.isUserOnline(userToken);
  }

  /**
   * 获取在线用户数量（可选功能）
   */
  static async getOnlineUserCount(): Promise<number> {
    // 这个功能需要遍历所有在线用户，成本较高
    // 可以考虑使用 Redis 的 SCAN 命令实现
    // 暂时返回 0，后续根据需要实现
    return 0;
  }

  /**
   * 清理过期的通知数据
   */
  static async cleanupExpiredData(): Promise<void> {
    await RedisManager.cleanupExpiredConnections();
  }
}

/**
 * 通知事件类型定义
 */
export interface CommentNotificationData {
  commentId: string;
  siteId: string;
  pageIdentifier: string;
  content?: string;
  authorNickname: string;
  authorToken: string;
  parentId?: string;
}

/**
 * 通知配置接口
 */
export interface NotificationConfig {
  enableRealTimeNotifications: boolean;
  enableEmailNotifications: boolean;
  enableWebPushNotifications: boolean;
  notificationRetentionDays: number;
}