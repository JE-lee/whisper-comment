import { FastifyInstance, FastifyRequest, FastifyReply, preValidationHookHandler } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';
import { ApiResponse } from '../types/common';

/**
 * 请求验证中间件
 * 统一的请求参数验证，集成Zod schema
 */
export async function requestValidatorMiddleware(fastify: FastifyInstance) {
  // 添加全局验证错误处理
  fastify.setSchemaErrorFormatter((errors, dataVar) => {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.map(error => ({
          field: error.instancePath || error.schemaPath,
          message: error.message,
          value: error.data,
        })),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return new Error(JSON.stringify(response));
  });
}

/**
 * 创建Zod验证钩子
 */
export function createZodValidationHook<T>(schema: ZodSchema<T>, target: 'body' | 'query' | 'params' = 'body'): preValidationHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = target === 'body' ? request.body : 
                   target === 'query' ? request.query : 
                   request.params;
      
      const validatedData = schema.parse(data);
      
      // 将验证后的数据重新赋值
      if (target === 'body') {
        request.body = validatedData;
      } else if (target === 'query') {
        request.query = validatedData;
      } else {
        request.params = validatedData;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid ${target} parameters`,
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              received: err.received,
            })),
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        return reply.code(400).send(response);
      }
      throw error;
    }
  };
}

/**
 * 验证分页参数
 */
export function validatePaginationHook(): preValidationHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    
    if (query.page !== undefined) {
      const page = parseInt(query.page);
      if (isNaN(page) || page < 1) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid page parameter',
            details: 'Page must be a positive integer',
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        return reply.code(400).send(response);
      }
      query.page = page;
    }
    
    if (query.limit !== undefined) {
      const limit = parseInt(query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid limit parameter',
            details: 'Limit must be between 1 and 100',
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        return reply.code(400).send(response);
      }
      query.limit = limit;
    }
  };
}

/**
 * 验证排序参数
 */
export function validateSortHook(allowedFields: string[]): preValidationHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    
    if (query.sortBy && !allowedFields.includes(query.sortBy)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid sortBy parameter',
          details: `Allowed fields: ${allowedFields.join(', ')}`,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      return reply.code(400).send(response);
    }
    
    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid sortOrder parameter',
          details: 'Sort order must be "asc" or "desc"',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      return reply.code(400).send(response);
    }
  };
}