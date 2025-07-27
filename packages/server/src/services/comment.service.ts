import { Comment } from '@prisma/client';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentListQuery, CommentResponse, CommentListResponse, CommentStatus } from '../types/comment';
import { PaginationParams, PaginationInfo } from '../types/common';

type CommentWithPossibleReplies = Comment & { replies?: CommentWithPossibleReplies[] };

export class CommentService {
  constructor(private commentRepository: CommentRepository) {}

  /**
   * 获取评论列表
   */
  async getCommentList(query: CommentListQuery & PaginationParams): Promise<CommentListResponse> {
    const { page = 1, limit = 20 } = query;
    
    // 验证分页参数
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Invalid pagination parameters');
    }

    // 从 Repository 获取数据
    const { comments, total } = await this.commentRepository.findMany(query);

    // 转换为 API 响应格式
    const responseComments = comments.map(comment => this.transformToResponse(comment));

    // 计算分页信息
    const pagination = this.calculatePagination(page, limit, total);

    return {
      comments: responseComments,
      pagination,
    };
  }

  /**
   * 获取单个评论详情
   */
  async getCommentById(commentId: string): Promise<CommentResponse | null> {
    const comment = await this.commentRepository.findById(commentId);
    return comment ? this.transformToResponse(comment) : null;
  }

  /**
   * 获取页面评论统计
   */
  async getPageStats(siteId: string, pageIdentifier: string) {
    const stats = await this.commentRepository.getPageStats(siteId, pageIdentifier);
    
    return {
      total: Object.values(stats).reduce((sum, count) => sum + count, 0),
      pending: stats[CommentStatus.PENDING] || 0,
      approved: stats[CommentStatus.APPROVED] || 0,
      rejected: stats[CommentStatus.REJECTED] || 0,
      spam: stats[CommentStatus.SPAM] || 0,
    };
  }

  /**
   * 批量审核评论
   */
  async moderateComments(commentIds: string[], status: CommentStatus): Promise<number> {
    // 验证状态值
    if (!Object.values(CommentStatus).includes(status)) {
      throw new Error('Invalid comment status');
    }

    return this.commentRepository.updateStatus(commentIds, status);
  }

  /**
   * 将数据库模型转换为 API 响应格式
   */
  private transformToResponse(comment: CommentWithPossibleReplies): CommentResponse {
    return {
      commentId: comment.commentId,
      siteId: comment.siteId,
      pageIdentifier: comment.pageIdentifier,
      parentId: comment.parentId,
      authorNickname: comment.authorNickname,
      content: comment.content,
      status: comment.status as CommentStatus,
      createdAt: comment.createdAt,
      replies: comment.replies?.map(reply => this.transformToResponse(reply)),
    };
  }

  /**
   * 计算分页信息
   */
  private calculatePagination(page: number, limit: number, total: number): PaginationInfo {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * 验证站点权限
   */
  private async validateSiteAccess(): Promise<boolean> {
    // 这里可以添加站点权限验证逻辑
    // 例如验证 API Key 是否匹配
    return true;
  }

  /**
   * 过滤敏感内容
   */
  private sanitizeContent(content: string): string {
    // 这里可以添加内容过滤逻辑
    // 例如移除恶意脚本、敏感词汇等
    return content.trim();
  }
}