import { FastifyReply } from 'fastify';
import { ApiResponse } from '../types/common';

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

/**
 * 未找到错误类
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

/**
 * 权限错误类
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

/**
 * 禁止访问错误类
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

/**
 * 统一错误处理函数
 */
export function handleError(error: unknown, reply: FastifyReply): FastifyReply {
  // 记录错误日志
  console.error('Application Error:', {
    name: (error as Error).name,
    message: (error as Error).message,
    stack: (error as Error).stack,
    timestamp: new Date().toISOString(),
  });

  // 应用自定义错误
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return reply.code(error.statusCode).send(response);
  }

  // Zod 验证错误
  if ((error as any).name === 'ZodError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: (error as any).errors,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return reply.code(400).send(response);
  }

  // Fastify 验证错误
  if ((error as any).validation) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: (error as any).validation,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return reply.code(400).send(response);
  }

  // Prisma 错误
  if ((error as any).code && (error as any).code.startsWith('P')) {
    let message = 'Database operation failed';
    let statusCode = 500;

    // 处理常见的 Prisma 错误
    switch ((error as any).code) {
      case 'P2002':
        message = 'Unique constraint violation';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint violation';
        statusCode = 400;
        break;
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message,
        details: process.env.NODE_ENV === 'development' ? (error as any).meta : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return reply.code(statusCode).send(response);
  }

  // 未知错误
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return reply.code(500).send(response);
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, statusCode: number = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}