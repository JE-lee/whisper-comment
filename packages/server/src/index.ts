import { config } from './config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './lib/database';
import { commentRoutes } from './routes/comment.routes';

// 创建Fastify实例
const fastify: FastifyInstance = Fastify({
  logger: true,
});

// 注册 CORS 插件
fastify.register(require('@fastify/cors'), {
  origin: true, // 允许所有来源，生产环境应该配置具体域名
});

// 注册路由
fastify.register(commentRoutes);

// 声明路由
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { hello: 'world', service: 'whisper-comment-server', message: 'WhisperComment Server is running!' };
});

// 健康检查端点
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'whisper-comment-server',
      version: '1.0.0',
      database: 'connected',
    };
  } catch (error) {
    reply.code(503);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'whisper-comment-server',
      version: '1.0.0',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Database info endpoint (for development)
fastify.get('/db-info', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = (await prisma.$queryRaw`SELECT version()`) as Array<{ version: string }>;
    return {
      database: 'PostgreSQL',
      version: result[0]?.version || 'Unknown',
      prisma_version: '6.12.0',
    };
  } catch (error) {
    reply.code(500);
    return {
      error: 'Failed to get database info',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// 启动服务器
const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    const port = config.PORT;
    const host = config.HOST;

    await fastify.listen({ port, host });
    console.log(`🚀 WhisperComment Server is running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/documentation`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await fastify.close();
  process.exit(0);
});

start();