/**
 * 通用的 JSON Schema 定义
 * 用于 Fastify 路由的通用请求和响应验证
 */

// 通用成功响应 Schema
export const baseSuccessResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    meta: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
      },
    },
  },
};

// 通用错误响应 Schema
export const baseErrorResponseSchema = {
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
};

// 分页信息 Schema
export const paginationResponseSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer' },
    limit: { type: 'integer' },
    total: { type: 'integer' },
    totalPages: { type: 'integer' },
    hasNext: { type: 'boolean' },
    hasPrev: { type: 'boolean' },
  },
};

// UUID 参数 Schema
export const uuidParamSchema = {
  type: 'string',
  format: 'uuid',
};

// 通用分页查询参数 Schema
export const paginationRequestSchema = {
  page: { type: 'integer', minimum: 1, default: 1, description: '页码' },
  limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: '每页数量' },
};

// 通用排序参数 Schema
export const sortRequestSchema = {
  sortBy: { type: 'string', description: '排序字段' },
  sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: '排序方向' },
};