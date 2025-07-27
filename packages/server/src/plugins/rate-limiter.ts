import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config';
import { ApiResponse } from '../types/common';

/**
 * 速率限制插件
 * 防止API滥用，基于IP限制请求频率
 */
export async function rateLimiterPlugin(fastify: FastifyInstance) {
  // 全局速率限制
  await fastify.register(rateLimit, {
    max: config.isDevelopment ? 1000 : 100, // 开发环境更宽松
    timeWindow: '1 minute',
    skipOnError: true, // 如果存储出错，跳过限制
    keyGenerator: (request) => {
      // 基于IP地址生成key
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          details: {
            limit: context.max,
            resetTime: new Date(Date.now() + context.ttl).toISOString(),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      return response;
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // 为特定路由设置更严格的限制
  const strictRateLimit = {
    max: config.isDevelopment ? 100 : 10,
    timeWindow: '1 minute',
    keyGenerator: (request: any) => request.ip,
    errorResponseBuilder: (request: any, context: any) => {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'STRICT_RATE_LIMIT_EXCEEDED',
          message: 'Too many requests for this endpoint, please try again later',
          details: {
            limit: context.max,
            remaining: context.remaining,
            resetTime: new Date(Date.now() + context.ttl).toISOString(),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      return response;
    },
  };

  // 为写操作设置更严格的限制
  fastify.register(async function (fastify) {
    await fastify.register(rateLimit, strictRateLimit);
    
    // 这里可以添加需要严格限制的路由
    // 例如：创建、更新、删除操作
  }, { prefix: '/api/v1/comments' });
}

/**
 * 创建自定义速率限制配置
 */
export function createCustomRateLimit(options: {
  max: number;
  timeWindow: string;
  skipSuccessfulRequests?: boolean;
}) {
  return {
    ...options,
    keyGenerator: (request: any) => request.ip,
    errorResponseBuilder: (request: any, context: any) => {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded for this endpoint',
          details: {
            limit: context.max,
            remaining: context.remaining,
            resetTime: new Date(Date.now() + context.ttl).toISOString(),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      return response;
    },
  };
}