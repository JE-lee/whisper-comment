import { FastifyInstance } from 'fastify';
import { FilterController } from '../controllers/filter.controller';
import { FilterService } from '../services/filter.service';
import {
  createKeywordFilterRequestSchema,
  updateKeywordFilterRequestSchema,
  filterIdParamSchema,
  filterListQuerySchema,
  filterLogQuerySchema,
  filterStatsQuerySchema,
  testFilterRequestSchema,
  keywordFilterApiResponseSchema,
  keywordFilterListApiResponseSchema,
  filterLogListApiResponseSchema,
  filterStatsApiResponseSchema,
  testFilterApiResponseSchema,
  deleteFilterApiResponseSchema
} from '../schemas/filter.schema';

export async function filterRoutes(fastify: FastifyInstance) {
  // 初始化服务和控制器
  const filterService = new FilterService((fastify as any).prisma);
  const filterController = new FilterController(filterService);

  // 关键词过滤器管理路由
  
  // 获取关键词过滤器列表
  fastify.get('/admin/filters/keywords', {
    schema: {
      tags: ['Filter Management'],
      summary: '获取关键词过滤器列表',
      description: '获取站点的关键词过滤器列表，支持分页和筛选',
      querystring: filterListQuerySchema,
      response: {
        200: keywordFilterListApiResponseSchema
      }
    },
    handler: filterController.getFilters.bind(filterController)
  });

  // 获取单个关键词过滤器
  fastify.get('/admin/filters/keywords/:filterId', {
    schema: {
      tags: ['Filter Management'],
      summary: '获取单个关键词过滤器',
      description: '根据ID获取特定的关键词过滤器详情',
      params: filterIdParamSchema,
      response: {
        200: keywordFilterApiResponseSchema
      }
    },
    handler: filterController.getFilterById.bind(filterController)
  });

  // 创建关键词过滤器
  fastify.post('/admin/filters/keywords', {
    schema: {
      tags: ['Filter Management'],
      summary: '创建关键词过滤器',
      description: '创建新的关键词过滤器规则',
      body: createKeywordFilterRequestSchema,
      response: {
        201: keywordFilterApiResponseSchema
      }
    },
    handler: filterController.createFilter.bind(filterController)
  });

  // 更新关键词过滤器
  fastify.put('/admin/filters/keywords/:filterId', {
    schema: {
      tags: ['Filter Management'],
      summary: '更新关键词过滤器',
      description: '更新现有的关键词过滤器规则',
      params: filterIdParamSchema,
      body: updateKeywordFilterRequestSchema,
      response: {
        200: keywordFilterApiResponseSchema
      }
    },
    handler: filterController.updateFilter.bind(filterController)
  });

  // 删除关键词过滤器
  fastify.delete('/admin/filters/keywords/:filterId', {
    schema: {
      tags: ['Filter Management'],
      summary: '删除关键词过滤器',
      description: '删除指定的关键词过滤器',
      params: filterIdParamSchema,
      response: {
        200: deleteFilterApiResponseSchema
      }
    },
    handler: filterController.deleteFilter.bind(filterController)
  });

  // 过滤日志路由
  
  // 获取过滤日志
  fastify.get('/admin/filters/logs', {
    schema: {
      tags: ['Filter Logs'],
      summary: '获取过滤日志',
      description: '获取关键词过滤的执行日志，支持分页和筛选',
      querystring: filterLogQuerySchema,
      response: {
        200: filterLogListApiResponseSchema
      }
    },
    handler: filterController.getFilterLogs.bind(filterController)
  });

  // 获取过滤统计
  fastify.get('/admin/filters/stats', {
    schema: {
      tags: ['Filter Statistics'],
      summary: '获取过滤统计',
      description: '获取关键词过滤的统计信息，包括过滤次数、动作分布等',
      querystring: filterStatsQuerySchema,
      response: {
        200: filterStatsApiResponseSchema
      }
    },
    handler: filterController.getFilterStats.bind(filterController)
  });

  // 测试过滤器
  fastify.post('/admin/filters/test', {
    schema: {
      tags: ['Filter Testing'],
      summary: '测试内容过滤',
      description: '测试指定内容在当前过滤规则下的处理结果',
      body: testFilterRequestSchema,
      response: {
        200: testFilterApiResponseSchema
      }
    },
    handler: filterController.testFilter.bind(filterController)
  });
}