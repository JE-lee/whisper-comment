import { FastifyInstance } from 'fastify';
import { commentRoutes } from './comments/index.route';
import { filterRoutes } from './filter.routes';

/**
 * 注册所有路由模块
 * @param fastify Fastify 实例
 */
export async function registerRoutes(fastify: FastifyInstance) {
  // 注册评论相关路由
  await fastify.register(commentRoutes);
  
  // 注册过滤器相关路由
  await fastify.register(filterRoutes);
  
  // 未来可以在这里添加其他模块的路由
  // await fastify.register(userRoutes);
  // await fastify.register(siteRoutes);
}