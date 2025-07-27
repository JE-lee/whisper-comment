import { FastifyInstance } from 'fastify';
import { CommentController } from '../../controllers/comment.controller';
import { CommentService } from '../../services/comment.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { prisma } from '../../lib/database';
import {
  getCommentListSchema,
  getCommentByIdSchema,
  getPageStatsSchema,
  moderateCommentsSchema,
} from '../../schemas/comment';

// 依赖注入：创建实例
const commentRepository = new CommentRepository(prisma);
const commentService = new CommentService(commentRepository);
const commentController = new CommentController(commentService);

export async function commentRoutes(
  fastify: FastifyInstance
) {
  // 添加路由前缀
  await fastify.register(
    async function (fastify) {
      // 获取评论列表
      fastify.get('/', {
        schema: getCommentListSchema,
        handler: commentController.getCommentList.bind(commentController),
      });

      // 获取单个评论详情
      fastify.get('/:commentId', {
        schema: getCommentByIdSchema,
        handler: commentController.getCommentById.bind(commentController),
      });

      // 获取页面评论统计
      fastify.get('/stats', {
        schema: getPageStatsSchema,
        handler: commentController.getPageStats.bind(commentController),
      });

      // 批量审核评论
      fastify.post('/moderate', {
        schema: moderateCommentsSchema,
        handler: commentController.moderateComments.bind(commentController),
      });
    },
    { prefix: '/api/comments' }
  );
}