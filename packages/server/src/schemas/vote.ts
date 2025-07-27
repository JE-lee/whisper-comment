/**
 * 投票相关的 JSON Schema 定义
 * 用于 Fastify 路由的请求和响应验证
 */

import {
  baseSuccessResponseSchema,
  baseErrorResponseSchema,
  uuidParamSchema,
} from './shared';

// 投票请求 Schema
export const voteCommentRequestSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['like', 'dislike'],
      description: '投票类型：like 或 dislike'
    }
  },
  required: ['action'],
  additionalProperties: false
} as const;

// 投票响应 Schema
export const voteCommentResponseSchema = {
  type: 'object',
  properties: {
    commentId: {
      type: 'string',
      format: 'uuid',
      description: '评论ID'
    },
    likes: {
      type: 'integer',
      minimum: 0,
      description: '点赞数'
    },
    dislikes: {
      type: 'integer',
      minimum: 0,
      description: '踩数'
    },
    userAction: {
      type: ['string', 'null'],
      enum: ['like', 'dislike', null],
      description: '用户当前投票状态'
    }
  },
  required: ['commentId', 'likes', 'dislikes', 'userAction'],
  additionalProperties: false
} as const;

// 投票路由 Schema
export const voteCommentSchema = {
  tags: ['Comments'],
  summary: '对评论进行投票',
  description: '任何人都可以对评论进行点赞或踩，每次操作都会增加相应的计数',
  params: {
    type: 'object',
    properties: {
      commentId: uuidParamSchema
    },
    required: ['commentId']
  },
  body: voteCommentRequestSchema,
  response: {
    200: {
      ...baseSuccessResponseSchema,
      properties: {
        ...baseSuccessResponseSchema.properties,
        data: voteCommentResponseSchema,
      },
    },
    400: baseErrorResponseSchema,
    404: baseErrorResponseSchema,
  },
} as const;

// 输入类型定义
export type VoteCommentRequestInput = {
  Params: { commentId: string };
  Body: {
    action: 'like' | 'dislike';
    authorToken: string;
  };
};