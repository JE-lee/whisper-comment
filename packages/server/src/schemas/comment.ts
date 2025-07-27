/**
 * 评论相关的 JSON Schema 定义
 * 用于 Fastify 路由的请求和响应验证
 */

import {
  baseSuccessResponseSchema,
  baseErrorResponseSchema,
  paginationResponseSchema,
  uuidParamSchema,
  paginationRequestSchema,
  sortRequestSchema,
} from './shared';

// 为了支持递归引用，我们需要定义一个完整的schema
const commentResponseSchemaWithDefinitions = {
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
    replies: {
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
          replies: { type: 'array', items: {} }, // 简化嵌套
        },
      },
    },
  },
};



// 请求参数 Schema
const commentListRequestSchema = {
  type: 'object',
  properties: {
    siteId: { ...uuidParamSchema, description: '站点 ID' },
    pageIdentifier: { type: 'string', description: '页面标识符' },
    status: { type: 'integer', enum: [0, 1, 2, 3], description: '评论状态' },
    authorToken: { type: 'string', description: '作者令牌' },
    parentId: { 
      oneOf: [
        { ...uuidParamSchema },
        { type: 'string', enum: [''] }
      ],
      description: '父评论 ID，空字符串表示查询顶级评论' 
    },
    ...paginationRequestSchema,
    ...sortRequestSchema,
    sortBy: { type: 'string', enum: ['createdAt', 'status'], default: 'createdAt', description: '排序字段' },
  },
  required: ['siteId'],
};

const commentByIdRequestSchema = {
  type: 'object',
  properties: {
    commentId: { ...uuidParamSchema, description: '评论 ID' },
  },
  required: ['commentId'],
};

const pageStatsRequestSchema = {
  type: 'object',
  properties: {
    siteId: { ...uuidParamSchema, description: '站点 ID' },
    pageIdentifier: { type: 'string', description: '页面标识符' },
  },
  required: ['siteId', 'pageIdentifier'],
};

const createCommentRequestSchema = {
  type: 'object',
  properties: {
    siteId: { ...uuidParamSchema, description: '站点 ID' },
    pageIdentifier: { type: 'string', description: '页面标识符' },
    parentId: { ...uuidParamSchema, description: '父评论 ID（可选）' },
    authorToken: { type: 'string', description: '作者令牌' },
    authorNickname: { type: 'string', minLength: 1, maxLength: 50, description: '作者昵称' },
    content: { type: 'string', minLength: 1, maxLength: 2000, description: '评论内容' },
  },
  required: ['siteId', 'pageIdentifier', 'authorToken', 'authorNickname', 'content'],
};

const moderateCommentsRequestSchema = {
  type: 'object',
  properties: {
    commentIds: {
      type: 'array',
      items: uuidParamSchema,
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
};

// 获取评论列表的 Schema
export const getCommentListSchema = {
  description: '获取评论列表',
  tags: ['Comments'],
  querystring: commentListRequestSchema,
  response: {
    200: {
      ...baseSuccessResponseSchema,
      properties: {
        ...baseSuccessResponseSchema.properties,
        data: {
          type: 'object',
          properties: {
            comments: {
              type: 'array',
              items: commentResponseSchemaWithDefinitions,
            },
            pagination: paginationResponseSchema,
          },
        },
      },
    },
  },
};

// 获取单个评论详情的 Schema
export const getCommentByIdSchema = {
  description: '获取单个评论详情',
  tags: ['Comments'],
  params: commentByIdRequestSchema,
  response: {
    200: {
      ...baseSuccessResponseSchema,
      properties: {
        ...baseSuccessResponseSchema.properties,
        data: commentResponseSchemaWithDefinitions,
      },
    },
    404: baseErrorResponseSchema,
  },
};

// 获取页面评论统计的 Schema
export const getPageStatsSchema = {
  description: '获取页面评论统计',
  tags: ['Comments'],
  querystring: pageStatsRequestSchema,
};

// 创建评论的 Schema
export const createCommentSchema = {
  description: '创建新评论',
  tags: ['Comments'],
  body: createCommentRequestSchema,
  response: {
    201: {
      ...baseSuccessResponseSchema,
      properties: {
        ...baseSuccessResponseSchema.properties,
        data: commentResponseSchemaWithDefinitions,
      },
    },
    400: baseErrorResponseSchema,
  },
};

// 批量审核评论的 Schema
export const moderateCommentsSchema = {
  description: '批量审核评论',
  tags: ['Comments'],
  body: moderateCommentsRequestSchema,
};