import { FastifyInstance } from 'fastify';
import { CommentController } from '../../controllers/comment.controller';
import { CommentService } from '../../services/comment.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { prisma } from '../../lib/database';
import {
  getCommentListSchema,
  getCommentByIdSchema,
  getPageStatsSchema,
  createCommentSchema,
  moderateCommentsSchema,
} from '../../schemas/comment';
import { voteCommentSchema } from '../../schemas/vote';

// 依赖注入：创建实例
const commentRepository = new CommentRepository(prisma);
const commentService = new CommentService(commentRepository);
const commentController = new CommentController(commentService);

export async function commentRoutes(
  fastify: FastifyInstance
) {
  // 添加CORS头到所有评论路由
  fastify.addHook('onSend', async (request, reply, payload) => {
    const origin = request.headers.origin;
    if (origin) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Vary', 'Origin');
    }
    return payload;
  });
  // 添加路由前缀
  await fastify.register(
    async function (fastify) {
      // 获取评论列表
      fastify.get('/', {
        schema: getCommentListSchema,
        handler: commentController.getCommentList.bind(commentController),
      });

      // 创建新评论
      fastify.post('/', {
        schema: createCommentSchema,
        handler: commentController.createComment.bind(commentController),
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

      // 对评论进行投票
      fastify.post('/:commentId/vote', {
        schema: voteCommentSchema,
        handler: commentController.voteComment.bind(commentController),
      });
    },
    { prefix: '/api/comments' }
  );
}