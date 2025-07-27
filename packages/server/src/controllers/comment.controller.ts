import { FastifyRequest, FastifyReply } from 'fastify';
import { CommentService } from '../services/comment.service';
import { ApiResponse } from '../types/common';
import { CommentListResponse, CommentResponse } from '../types/comment';
import { handleError, createSuccessResponse, NotFoundError } from '../utils/errors';

// 定义接口类型
interface CommentListQueryInput {
  siteId: string;
  pageIdentifier?: string;
  status?: number;
  authorToken?: string;
  parentId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface CommentIdParamInput {
  commentId: string;
}

interface PageStatsQueryInput {
  siteId: string;
  pageIdentifier: string;
}

interface ModerateCommentsInput {
  commentIds: string[];
  status: number;
}

interface CreateCommentInput {
  siteId: string;
  pageIdentifier: string;
  parentId?: string;
  authorToken: string;
  authorNickname: string;
  content: string;
}

export class CommentController {
  constructor(private commentService: CommentService) {}

  /**
   * 获取评论列表
   * GET /api/comments
   */
  async getCommentList(
    request: FastifyRequest<{ Querystring: CommentListQueryInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<CommentListResponse>> {
    try {
      // Fastify已经通过schema验证了参数，直接使用
      const query = {
        ...request.query,
        page: request.query.page || 1,
        limit: request.query.limit || 20,
        sortBy: request.query.sortBy || 'createdAt',
        sortOrder: request.query.sortOrder || 'desc'
      };

      // 调用服务层
      const result = await this.commentService.getCommentList(query);

      const response = createSuccessResponse(result);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 获取单个评论详情
   * GET /api/comments/:commentId
   */
  async getCommentById(
    request: FastifyRequest<{ Params: CommentIdParamInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<CommentResponse | null>> {
    try {
      const { commentId } = request.params;

      // 调用服务层
      const comment = await this.commentService.getCommentById(commentId);

      if (!comment) {
        throw new NotFoundError('Comment');
      }

      const response = createSuccessResponse(comment);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 获取页面评论统计
   * GET /api/comments/stats
   */
  async getPageStats(
    request: FastifyRequest<{ Querystring: PageStatsQueryInput }>,
    reply: FastifyReply
  ) {
    try {
      const { siteId, pageIdentifier } = request.query;

      // 调用服务层
      const stats = await this.commentService.getPageStats(siteId, pageIdentifier);

      const response = createSuccessResponse(stats);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 创建新评论
   * POST /api/comments
   */
  async createComment(
    request: FastifyRequest<{ Body: CreateCommentInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<CommentResponse>> {
    try {
      const commentData = request.body;

      // 调用服务层
      const comment = await this.commentService.createComment(commentData);

      const response = createSuccessResponse(comment);
      return reply.code(201).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 批量审核评论
   * POST /api/comments/moderate
   */
  async moderateComments(
    request: FastifyRequest<{ Body: ModerateCommentsInput }>,
    reply: FastifyReply
  ) {
    try {
      const { commentIds, status } = request.body;

      // 调用服务层
      const updatedCount = await this.commentService.moderateComments(
        commentIds,
        status
      );

      const response = createSuccessResponse({
        updatedCount,
        message: `Successfully updated ${updatedCount} comments`,
      });
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: any, reply: FastifyReply): FastifyReply {
    return handleError(error, reply);
  }
}