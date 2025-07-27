import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse, ListResponse, PaginationInfo } from '../types/common';

/**
 * 响应格式化插件
 * 统一API响应格式，集成ApiResponse类型
 */
export async function responseFormatterPlugin(fastify: FastifyInstance) {
  // 添加响应格式化装饰器
  fastify.decorateReply('success', function(data: any, statusCode: number = 200) {
    const requestId = this.request.requestContext?.get('requestId');
    
    const response: ApiResponse<any> = {
      success: true,
      data,
      statusCode,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    
    this.code(statusCode);
    return this.send(response);
  });

  fastify.decorateReply('error', function(code: string, message: string, statusCode: number = 400, details?: any) {
    const requestId = this.request.requestContext?.get('requestId');
    
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    
    this.code(statusCode);
    return this.send(response);
  });

  fastify.decorateReply('paginated', function(items: any[], pagination: PaginationInfo, statusCode: number = 200) {
    const requestId = this.request.requestContext?.get('requestId');
    
    const listData: ListResponse<any> = {
      items,
      pagination,
    };
    
    const response: ApiResponse<ListResponse<any>> = {
      success: true,
      data: listData,
      statusCode,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    
    this.code(statusCode);
    return this.send(response);
  });

  // 添加响应时间到meta
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload) => {
    const startTime = (request as any).startTime;
    if (startTime && typeof payload === 'string') {
      try {
        const responseData = JSON.parse(payload);
        if (responseData.meta) {
          responseData.meta.responseTime = `${Date.now() - startTime}ms`;
          return JSON.stringify(responseData);
        }
      } catch {
        // 如果不是JSON，直接返回原payload
      }
    }
    return payload;
  });
}

/**
 * 扩展FastifyReply类型
 */
declare module 'fastify' {
  interface FastifyReply {
    success<T>(data: T, statusCode?: number): FastifyReply;
    error(code: string, message: string, statusCode?: number, details?: any): FastifyReply;
    paginated<T>(items: T[], pagination: PaginationInfo, statusCode?: number): FastifyReply;
  }
}

/**
 * 创建成功响应的工具函数
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * 创建错误响应的工具函数
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode?: number,
  details?: any,
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * 创建分页响应的工具函数
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationInfo,
  statusCode: number = 200,
  requestId?: string
): ApiResponse<ListResponse<T>> {
  const listData: ListResponse<T> = {
    items,
    pagination,
  };

  return {
    success: true,
    data: listData,
    statusCode,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}