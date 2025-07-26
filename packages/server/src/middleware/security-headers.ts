import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import { config } from '../config';

/**
 * 安全头中间件
 * 添加安全相关的HTTP头，防止常见的安全攻击
 */
export async function securityHeadersMiddleware(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    // 内容安全策略
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    
    // 跨域嵌入保护
    crossOriginEmbedderPolicy: config.isProduction,
    
    // DNS预取控制
    dnsPrefetchControl: {
      allow: false,
    },
    
    // 框架选项（防止点击劫持）
    frameguard: {
      action: 'deny',
    },
    
    // 隐藏X-Powered-By头
    hidePoweredBy: true,
    
    // HTTP严格传输安全
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true,
    },
    
    // IE无嗅探
    ieNoOpen: true,
    
    // 不缓存
    noSniff: true,
    
    // 来源策略
    originAgentCluster: true,
    
    // 权限策略
    permittedCrossDomainPolicies: false,
    
    // 引用者策略
    referrerPolicy: {
      policy: 'same-origin',
    },
    
    // XSS过滤
    xssFilter: true,
  });

  // 添加自定义安全头
  fastify.addHook('onSend', async (request, reply, payload) => {
    // 添加API版本头
    reply.header('X-API-Version', '1.0.0');
    
    // 添加服务标识
    reply.header('X-Service', 'whisper-comment-server');
    
    // 在生产环境中移除敏感信息
    if (config.isProduction) {
      reply.removeHeader('X-Powered-By');
      reply.removeHeader('Server');
    }
    
    // 添加缓存控制（对于API响应）
    if (request.url.startsWith('/api/')) {
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
    }
    
    return payload;
  });
}

/**
 * 开发环境安全头配置
 * 在开发环境中使用更宽松的安全策略
 */
export async function developmentSecurityHeadersMiddleware(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // 开发环境禁用CSP
    crossOriginEmbedderPolicy: false,
    hsts: false, // 开发环境不需要HSTS
    frameguard: {
      action: 'sameorigin', // 允许同源框架
    },
  });

  // 开发环境添加调试头
  fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Environment', 'development');
    reply.header('X-Debug-Mode', 'enabled');
    return payload;
  });
}