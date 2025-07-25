import { FastifyRequest, FastifyReply } from 'fastify';
import { CommentService } from '../services/comment.service';
import {
  commentListQuerySchema,
  commentIdParamSchema,
  pageStatsQuerySchema,
  moderateCommentsSchema,
  CommentListQueryInput,
  CommentIdParamInput,
  PageStatsQueryInput,
  ModerateCommentsInput,
} from '../schemas/comment.schema';
import { ApiResponse } from '../types/common';
import { CommentListResponse, CommentResponse } from '../types/comment';
import { handleError, createSuccessResponse, NotFoundError } from '../utils/errors';

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
      // 验证查询参数
      const query = commentListQuerySchema.parse(request.query);

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
      // 验证路径参数
      const { commentId } = commentIdParamSchema.parse(request.params);

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
      // 验证查询参数
      const query = pageStatsQuerySchema.parse(request.query);

      // 调用服务层
      const stats = await this.commentService.getPageStats(query.siteId, query.pageIdentifier);

      const response = createSuccessResponse(stats);
      return reply.code(200).send(response);
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
      // 验证请求体
      const body = moderateCommentsSchema.parse(request.body);

      // 调用服务层
      const updatedCount = await this.commentService.moderateComments(
        body.commentIds,
        body.status
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