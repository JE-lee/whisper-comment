import { CommentRepository } from '../repositories/comment.repository';
import { CommentListQuery, CommentResponse, CommentListResponse, CommentStatus, CreateCommentData, VoteCommentData, VoteResponse, VoteType } from '../types/comment';
import { PaginationParams, PaginationInfo } from '../types/common';

import { CommentWithRelations } from '../types/comment';

export class CommentService {
  constructor(private commentRepository: CommentRepository) {}

  /**
   * 获取评论列表
   */
  async getCommentList(query: CommentListQuery & PaginationParams, authorToken?: string): Promise<CommentListResponse> {
    const { page = 1, limit = 20 } = query;
    
    // 验证分页参数
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Invalid pagination parameters');
    }

    // 从 Repository 获取数据
    const { comments, total } = await this.commentRepository.findMany(query);

    // 获取用户投票状态（如果提供了 authorToken）
    let userVotes: Record<string, VoteType | null> = {};
    if (authorToken && comments.length > 0) {
      const commentIds = this.getAllCommentIds(comments);
      userVotes = await this.commentRepository.getUserVotes(commentIds, authorToken);
    }

    // 转换为 API 响应格式
    const responseComments = comments.map(comment => this.transformToResponse(comment, userVotes));

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
   * 创建新评论
   */
  async createComment(data: CreateCommentData): Promise<CommentResponse> {
    // 内容过滤
    const sanitizedContent = this.sanitizeContent(data.content);
    
    // 创建评论数据
    const commentData = {
      ...data,
      content: sanitizedContent,
    };

    // 调用 Repository 创建评论
    const comment = await this.commentRepository.create(commentData);

    // 转换为 API 响应格式
    return this.transformToResponse(comment);
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
  private transformToResponse(comment: any, userVotes: Record<string, VoteType | null> = {}): CommentResponse {
    const result: CommentResponse = {
      commentId: comment.commentId,
      siteId: comment.siteId,
      pageIdentifier: comment.pageIdentifier,
      parentId: comment.parentId,
      authorNickname: comment.authorNickname,
      content: comment.content,
      status: comment.status as CommentStatus,
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      userAction: userVotes[comment.commentId] || null,
      createdAt: comment.createdAt,
      replies: comment.replies ? comment.replies.map((reply: any) => this.transformToResponse(reply, userVotes)) : [],
    };
    
    // 强制确保replies字段存在
    if (!Object.prototype.hasOwnProperty.call(result, 'replies')) {
      result.replies = [];
    }
    
    return result;
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

  /**
   * 对评论进行投票
   * 简化版本：不需要身份验证，每次投票都有效
   */
  async voteComment(data: VoteCommentData): Promise<VoteResponse> {
    // 验证评论是否存在
    const comment = await this.commentRepository.findById(data.commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // 执行投票操作
    const updatedComment = await this.commentRepository.voteComment(data);

    return {
      commentId: updatedComment.commentId,
      likes: updatedComment.likes || 0,
      dislikes: updatedComment.dislikes || 0,
      userAction: data.voteType, // 返回当前投票类型
    };
  }

  /**
   * 获取所有评论ID（包括回复）
   */
  private getAllCommentIds(comments: CommentWithRelations[]): string[] {
    const ids: string[] = [];
    
    const collectIds = (commentList: any[]) => {
      commentList.forEach((comment: any) => {
        ids.push(comment.commentId);
        if (comment.replies && comment.replies.length > 0) {
          collectIds(comment.replies);
        }
      });
    };
    
    collectIds(comments);
    return ids;
  }
}