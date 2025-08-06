import { config } from './config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './lib/database';
import { registerRoutes } from './routes';
import { registerWebSocketRoutes } from './services/websocket.service';

// 导入插件
import {
  securityHeadersPlugin,
  developmentSecurityHeadersPlugin,
  corsEnhancedPlugin,
  developmentCorsPlugin,
  requestIdPlugin,
  requestTracingPlugin,
  requestLoggerPlugin,
  rateLimiterPlugin,
  requestValidatorPlugin,
  errorHandlerPlugin,
} from './plugins';

// 创建Fastify实例
const fastify: FastifyInstance = Fastify({
  logger: {
    level: config.isDevelopment ? 'debug' : 'info',
  },
  requestIdLogLabel: 'requestId',
  requestIdHeader: 'x-request-id',
});

// 直接在主实例上注册响应格式化装饰器
fastify.decorateReply('success', function(data: unknown, statusCode: number = 200) {
  const requestId = this.request.requestContext?.get('requestId');
  
  const response = {
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

fastify.decorateReply('error', function(code: string, message: string, statusCode: number = 400, details?: unknown) {
  const requestId = this.request.requestContext?.get('requestId');
  
  const response = {
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

fastify.decorateReply('paginated', function(items: unknown[], pagination: unknown, statusCode: number = 200) {
  const requestId = this.request.requestContext?.get('requestId');
  
  const listData = {
    items,
    pagination,
  };
  
  const response = {
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

// 注册插件和路由
fastify.register(async function (fastify) {
  // 1. 首先注册CORS插件（必须最先注册）
  if (config.isDevelopment) {
    await fastify.register(developmentCorsPlugin);
  } else {
    await fastify.register(corsEnhancedPlugin);
  }
  // 响应格式化装饰器已在主实例上注册，跳过插件注册
  
  // 2. 安全头插件
  if (config.isDevelopment) {
    await fastify.register(developmentSecurityHeadersPlugin);
  } else {
    await fastify.register(securityHeadersPlugin);
  }

  // 4. 请求ID和追踪插件
  await fastify.register(requestIdPlugin);
  await fastify.register(requestTracingPlugin);

  // 5. 请求日志插件
  await fastify.register(requestLoggerPlugin);

  // 6. 速率限制插件
  await fastify.register(rateLimiterPlugin);

  // 7. 请求验证插件
  await fastify.register(requestValidatorPlugin);

  // 8. 错误处理插件
  await fastify.register(errorHandlerPlugin);

  // 9. 注册 WebSocket 路由
  await registerWebSocketRoutes(fastify);
  
  // 10. 注册 HTTP 路由（在所有插件之后）
  await registerRoutes(fastify);
  
  // 声明基础路由
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.success({
      hello: 'world',
      service: 'whisper-comment-server',
      message: 'WhisperComment Server is running!',
      version: '1.0.0',
      environment: config.NODE_ENV,
    });
  });

  // 健康检查端点
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 检查数据库连接
      await prisma.$queryRaw`SELECT 1`;
      return reply.success({
        status: 'ok',
        service: 'whisper-comment-server',
        version: '1.0.0',
        environment: config.NODE_ENV,
        database: 'connected',
        uptime: process.uptime(),
      });
    } catch (error) {
      return reply.error(
        'HEALTH_CHECK_FAILED',
        'Health check failed',
        503,
        {
          service: 'whisper-comment-server',
          version: '1.0.0',
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  });

  // Database info endpoint (for development)
  fastify.get('/db-info', async (request: FastifyRequest, reply: FastifyReply) => {
    // 仅在开发环境提供此端点
    if (!config.isDevelopment) {
      return reply.error('FORBIDDEN', 'This endpoint is only available in development mode', 403);
    }

    try {
      const result = (await prisma.$queryRaw`SELECT version()`) as Array<{ version: string }>;
      return reply.success({
        database: 'PostgreSQL',
        version: result[0]?.version || 'Unknown',
        prisma_version: '6.12.0',
        environment: config.NODE_ENV,
      });
    } catch (error) {
      return reply.error(
        'DATABASE_INFO_ERROR',
        'Failed to get database info',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });
});

// 启动服务器
const start = async (): Promise<void> => {
  try {
    // 暂时跳过数据库连接，专注测试 WebSocket 功能
    // await prisma.$connect();
    // fastify.log.info('Database connected successfully');
    fastify.log.info('Starting server without database connection for WebSocket testing');

    const port = config.PORT;
    const host = config.HOST;

    // 启动服务器
    await fastify.listen({ port, host });
    
    fastify.log.info({
      port,
      host,
      environment: config.NODE_ENV,
      version: '1.0.0',
    }, 'WhisperComment Server started successfully');
    
    console.log(`🚀 WhisperComment Server is running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/documentation`);
    console.log(`🔍 Health Check: http://${host}:${port}/health`);
    if (config.isDevelopment) {
      console.log(`🗄️  Database Info: http://${host}:${port}/db-info`);
    }
  } catch (err) {
    fastify.log.error(err, 'Failed to start server');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};

// 优雅关闭处理
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  console.log(`\n🛑 Received ${signal}, shutting down server...`);
  
  try {
    // 关闭Fastify服务器
    await fastify.close();
    fastify.log.info('Fastify server closed');
    
    // 暂时跳过数据库断开连接
    // await prisma.$disconnect();
    // fastify.log.info('Database disconnected');
    fastify.log.info('Server shutdown (database connection was skipped)');
    
    console.log('✅ Server shutdown completed');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown');
    console.error('❌ Error during shutdown:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};

// 监听关闭信号
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  fastify.log.fatal(error, 'Uncaught exception');
  console.error('💥 Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.fatal({ reason, promise }, 'Unhandled rejection');
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
});

start();