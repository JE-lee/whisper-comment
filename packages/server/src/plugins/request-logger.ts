import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * 请求日志插件
 * 记录请求详情、响应时间和状态码
 */
export async function requestLoggerPlugin(fastify: FastifyInstance) {
  // 添加请求开始时间
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).startTime = Date.now();
  });

  // 记录请求日志
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const responseTime = Date.now() - ((request as any).startTime || Date.now());
    
    const logData = {
      request: {
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers['user-agent'],
          'content-type': request.headers['content-type'],
          'authorization': request.headers.authorization ? '[REDACTED]' : undefined,
        },
        ip: request.ip,
        query: request.query,
        params: request.params,
      },
      response: {
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
      },
      timestamp: new Date().toISOString(),
    };

    // 根据状态码决定日志级别
    if (reply.statusCode >= 500) {
      request.log.error(logData, 'Request completed with server error');
    } else if (reply.statusCode >= 400) {
      request.log.warn(logData, 'Request completed with client error');
    } else {
      request.log.info(logData, 'Request completed successfully');
    }
  });

  // 记录慢请求
  fastify.addHook('onResponse', async (request: FastifyRequest) => {
    const responseTime = Date.now() - ((request as any).startTime || Date.now());
    
    // 如果响应时间超过 1 秒，记录为慢请求
    if (responseTime > 1000) {
      request.log.warn({
        method: request.method,
        url: request.url,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      }, 'Slow request detected');
    }
  });
}