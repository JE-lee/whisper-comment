import { FastifyInstance } from 'fastify';
import { CommentController } from '../controllers/comment.controller';
import { CommentService } from '../services/comment.service';
import { CommentRepository } from '../repositories/comment.repository';
import { prisma } from '../lib/database';

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
        schema: {
          description: '获取评论列表',
          tags: ['Comments'],
          querystring: {
            type: 'object',
            properties: {
              siteId: { type: 'string', format: 'uuid', description: '站点 ID' },
              pageIdentifier: { type: 'string', description: '页面标识符' },
              status: { type: 'integer', enum: [0, 1, 2, 3], description: '评论状态' },
              authorToken: { type: 'string', description: '作者令牌' },
              parentId: { type: 'string', format: 'uuid', description: '父评论 ID' },
              page: { type: 'integer', minimum: 1, default: 1, description: '页码' },
              limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: '每页数量' },
              sortBy: { type: 'string', enum: ['createdAt', 'status'], default: 'createdAt', description: '排序字段' },
              sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: '排序方向' },
            },
            required: ['siteId'],
          },
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    comments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          commentId: { type: 'string' },
                          siteId: { type: 'string' },
                          pageIdentifier: { type: 'string' },
                          parentId: { type: 'string', nullable: true },
                          authorNickname: { type: 'string' },
                          content: { type: 'string' },
                          status: { type: 'integer' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        hasNext: { type: 'boolean' },
                        hasPrev: { type: 'boolean' },
                      },
                    },
                  },
                },
                meta: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        handler: commentController.getCommentList.bind(commentController),
      });

      // 获取单个评论详情
      fastify.get('/:commentId', {
        schema: {
          description: '获取单个评论详情',
          tags: ['Comments'],
          params: {
            type: 'object',
            properties: {
              commentId: { type: 'string', format: 'uuid', description: '评论 ID' },
            },
            required: ['commentId'],
          },
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    commentId: { type: 'string' },
                    siteId: { type: 'string' },
                    pageIdentifier: { type: 'string' },
                    parentId: { type: 'string', nullable: true },
                    authorNickname: { type: 'string' },
                    content: { type: 'string' },
                    status: { type: 'integer' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
                meta: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
            404: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        handler: commentController.getCommentById.bind(commentController),
      });

      // 获取页面评论统计
      fastify.get('/stats', {
        schema: {
          description: '获取页面评论统计',
          tags: ['Comments'],
          querystring: {
            type: 'object',
            properties: {
              siteId: { type: 'string', format: 'uuid', description: '站点 ID' },
              pageIdentifier: { type: 'string', description: '页面标识符' },
            },
            required: ['siteId', 'pageIdentifier'],
          },
        },
        handler: commentController.getPageStats.bind(commentController),
      });

      // 批量审核评论
      fastify.post('/moderate', {
        schema: {
          description: '批量审核评论',
          tags: ['Comments'],
          body: {
            type: 'object',
            properties: {
              commentIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' },
                minItems: 1,
                description: '评论 ID 列表',
              },
              status: {
                type: 'integer',
                enum: [0, 1, 2, 3],
                description: '目标状态：0-待审核，1-已通过，2-已拒绝，3-垃圾评论',
              },
            },
            required: ['commentIds', 'status'],
          },
        },
        handler: commentController.moderateComments.bind(commentController),
      });
    },
    { prefix: '/api/comments' }
  );
}