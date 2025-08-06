import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * 认证中间件
 * 从请求头中提取用户token并验证
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    token: string;
  };
}

/**
 * 认证中间件函数
 * 从Authorization头或X-User-Token头中提取用户token
 */
export async function authenticateToken(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 从多个可能的头部获取token
    let token: string | undefined;
    
    // 1. 从Authorization头获取 (Bearer token格式)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // 2. 从X-User-Token头获取
    if (!token) {
      token = request.headers['x-user-token'] as string;
    }
    
    // 3. 从查询参数获取 (仅用于开发调试)
    if (!token && request.query && typeof request.query === 'object') {
      token = (request.query as any).token;
    }

    if (!token) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication token required',
        error: 'Missing token in Authorization header, X-User-Token header, or token query parameter'
      });
    }

    // 验证token格式 (whisper comment token格式: wc_[timestamp]_[uuid])
    if (!isValidWhisperToken(token)) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid token format',
        error: 'Token must be in whisper comment format: wc_[timestamp]_[uuid]'
      });
    }

    // 将用户信息添加到请求对象
    request.user = {
      token
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Authentication error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 验证whisper comment token格式
 * 格式: wc_[timestamp]_[uuid]
 */
function isValidWhisperToken(token: string): boolean {
  // 检查token格式：wc_[timestamp]_[uuid]
  const tokenPattern = /^wc_[a-z0-9]+_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  return tokenPattern.test(token);
}

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行
 */
export async function optionalAuthenticateToken(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 从多个可能的头部获取token
    let token: string | undefined;
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) {
      token = request.headers['x-user-token'] as string;
    }
    
    if (!token && request.query && typeof request.query === 'object') {
      token = (request.query as any).token;
    }

    // 如果没有token，继续执行（不要求认证）
    if (!token) {
      return;
    }

    // 如果有token，验证格式
    if (!isValidWhisperToken(token)) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid token format',
        error: 'Token must be in whisper comment format: wc_[timestamp]_[uuid]'
      });
    }

    // 将用户信息添加到请求对象
    request.user = {
      token
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Authentication error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}