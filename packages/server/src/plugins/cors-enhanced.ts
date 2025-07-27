import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from '../config';

/**
 * CORS增强插件
 * 提供更精细的CORS控制，基于环境的动态配置
 */
export async function corsEnhancedPlugin(fastify: FastifyInstance) {
  const corsOptions = {
    // 允许的源
    origin: (origin: string | undefined, callback: (err: Error | null, result: boolean) => void) => {
      // 开发环境允许所有源
      if (config.isDevelopment) {
        callback(null, true);
        return;
      }

      // 生产环境的允许列表
      const allowedOrigins = [
        'https://whisper-comment.vercel.app',
        'https://www.whisper-comment.com',
        // 添加其他允许的域名
      ];

      // 如果没有origin（比如移动应用或Postman），允许访问
      if (!origin) {
        callback(null, true);
        return;
      }

      // 检查origin是否在允许列表中
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'), false);
      }
    },

    // 允许的HTTP方法
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    // 允许的请求头
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
      'X-API-Key',
    ],

    // 暴露的响应头
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-API-Version',
    ],

    // 是否允许发送Cookie
    credentials: true,

    // 预检请求的缓存时间（秒）
    maxAge: config.isProduction ? 86400 : 3600, // 生产环境24小时，开发环境1小时

    // 预检请求成功状态码
    optionsSuccessStatus: 204,

    // 是否隐藏OPTIONS请求的日志
    hideOptionsRoute: true,
  };

  await fastify.register(cors, corsOptions);

  // 添加CORS相关的安全头
  fastify.addHook('onSend', async (request, reply, payload) => {
    // 添加额外的安全头
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    
    // 在开发环境添加调试信息
    if (config.isDevelopment) {
      reply.header('X-CORS-Debug', 'enabled');
    }
    
    return payload;
  });

  // 记录CORS相关的请求
  fastify.addHook('onRequest', async (request) => {
    const origin = request.headers.origin;
    const method = request.method;
    
    if (method === 'OPTIONS') {
      request.log.debug({
        origin,
        method,
        headers: request.headers,
      }, 'CORS preflight request');
    } else if (origin) {
      request.log.debug({
        origin,
        method,
      }, 'Cross-origin request');
    }
  });
}

/**
 * 开发环境CORS配置
 * 更宽松的CORS策略用于开发
 */
export async function developmentCorsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: true, // 允许所有源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: '*',
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 200,
  });

  // 确保所有响应都包含CORS头
  fastify.addHook('onSend', async (request, reply, payload) => {
    const origin = request.headers.origin;
    if (origin) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Vary', 'Origin');
    }
    reply.header('X-Dev-CORS', 'permissive');
    return payload;
  });
}

/**
 * 生产环境CORS配置
 * 严格的CORS策略用于生产
 */
export async function productionCorsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = [
    'https://whisper-comment.vercel.app',
    'https://www.whisper-comment.com',
    // 添加其他生产环境允许的域名
  ];

  await fastify.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
    ],
    credentials: true,
    maxAge: 86400, // 24小时
  });

  // 生产环境安全头
  fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return payload;
  });
}