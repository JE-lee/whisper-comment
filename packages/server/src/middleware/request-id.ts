import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import requestContext from '@fastify/request-context';
import { v4 as uuidv4 } from 'uuid';

/**
 * 请求ID中间件
 * 为每个请求生成唯一ID，便于日志追踪和调试
 */
export async function requestIdMiddleware(fastify: FastifyInstance) {
  // 注册请求上下文插件
  await fastify.register(requestContext, {
    defaultStoreValues: {
      requestId: () => uuidv4(),
    },
  });

  // 添加请求ID到请求头
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // 从请求头获取现有的请求ID，或生成新的
    let requestId = request.headers['x-request-id'] as string;
    
    if (!requestId || typeof requestId !== 'string') {
      requestId = uuidv4();
    }
    
    // 将请求ID存储到上下文中
    request.requestContext.set('requestId', requestId);
    
    // 将请求ID添加到日志上下文
    request.log = request.log.child({ requestId });
    
    // 在响应头中返回请求ID
    reply.header('X-Request-ID', requestId);
  });

  // 添加请求ID到错误日志
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error) => {
    const requestId = request.requestContext.get('requestId');
    
    request.log.error({
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, 'Request error with ID');
  });
}

/**
 * 获取当前请求ID的工具函数
 */
export function getCurrentRequestId(request: FastifyRequest): string {
  return request.requestContext.get('requestId') || 'unknown';
}

/**
 * 生成关联ID（用于关联多个相关请求）
 */
export function generateCorrelationId(): string {
  return `corr_${uuidv4()}`;
}

/**
 * 请求追踪中间件
 * 添加更详细的请求追踪信息
 */
export async function requestTracingMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const requestId = request.requestContext.get('requestId');
    const traceData = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      startTime: Date.now(),
    };
    
    // 存储追踪数据
    request.requestContext.set('traceData', traceData);
    
    request.log.info(traceData, 'Request started');
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const traceData = request.requestContext.get('traceData');
    const endTime = Date.now();
    const duration = endTime - (traceData?.startTime || endTime);
    
    const responseData = {
      ...traceData,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      endTime,
    };
    
    request.log.info(responseData, 'Request completed');
  });
}