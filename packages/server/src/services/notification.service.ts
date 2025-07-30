import { NotificationMessage, RedisManager } from '../lib/redis';
import { sendNotification } from './websocket.service';

/**
 * 通知服务类
 * 负责处理各种评论相关的通知逻辑
 */
export class NotificationService {
  /**
   * 发送新评论通知
   * @param commentData 评论数据
   */
  static async sendNewCommentNotification(
    commentData: {
      commentId: string;
      siteId: string;
      pageIdentifier: string;
      content: string;
      authorNickname: string;
      authorToken: string;
      parentId?: string;
    }
  ) {
    const notification: NotificationMessage = {
      type: 'new_comment',
      data: {
        commentId: commentData.commentId,
        siteId: commentData.siteId,
        pageIdentifier: commentData.pageIdentifier,
        content: commentData.content,
        authorNickname: commentData.authorNickname,
        ...(commentData.parentId && { parentId: commentData.parentId }),
      },
      timestamp: new Date().toISOString(),
    };

    // 如果是回复评论，需要通知被回复的用户
    if (commentData.parentId) {
      await this.sendCommentReplyNotification(commentData);
    }

    // 广播给页面上的其他用户（排除评论作者）
    await sendNotification(notification);
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
    // 这里需要根据 parentId 查询原评论的作者token
    // 由于我们需要访问数据库，这里先预留接口
    // 实际实现时需要注入 CommentService 或直接查询数据库
    
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

    // TODO: 查询原评论作者的 userToken，然后发送定向通知
    // const parentComment = await CommentService.getCommentById(replyData.parentId);
    // if (parentComment) {
    //   notification.targetUserToken = parentComment.authorToken;
    //   await sendNotification(notification);
    // }

    // 暂时广播给所有用户
    await sendNotification(notification);
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