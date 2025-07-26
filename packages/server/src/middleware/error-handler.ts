import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { handleError } from '../utils/errors';
import { ApiResponse } from '../types/common';

/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误
 */
export async function errorHandlerMiddleware(fastify: FastifyInstance) {
  // 设置全局错误处理器
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // 记录错误日志
    request.log.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      timestamp: new Date().toISOString(),
    }, 'Request error occurred');

    // 使用现有的错误处理函数
    return handleError(error, reply);
  });

  // 处理 404 错误
  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return reply.code(404).send(response);
  });
}