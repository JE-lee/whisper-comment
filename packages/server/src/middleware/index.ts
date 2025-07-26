/**
 * 中间件统一导出文件
 * 提供所有中间件的统一入口
 */

// 错误处理中间件
export { errorHandlerMiddleware } from './error-handler';

// 请求日志中间件
export { requestLoggerMiddleware } from './request-logger';

// 速率限制中间件
export { 
  rateLimiterMiddleware, 
  createCustomRateLimit 
} from './rate-limiter';

// 请求验证中间件
export { 
  requestValidatorMiddleware,
  createZodValidationHook,
  validatePaginationHook,
  validateSortHook
} from './request-validator';

// 安全头中间件
export { 
  securityHeadersMiddleware,
  developmentSecurityHeadersMiddleware
} from './security-headers';

// 请求ID中间件
export { 
  requestIdMiddleware,
  requestTracingMiddleware,
  getCurrentRequestId,
  generateCorrelationId
} from './request-id';

// 响应格式化中间件
export { 
  responseFormatterMiddleware,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse
} from './response-formatter';

// CORS增强中间件
export { 
  corsEnhancedMiddleware,
  developmentCorsMiddleware,
  productionCorsMiddleware
} from './cors-enhanced';

// 中间件注册顺序配置
export const MIDDLEWARE_ORDER = [
  'security-headers',
  'cors-enhanced', 
  'request-id',
  'request-logger',
  'rate-limiter',
  'request-validator',
  'response-formatter',
  'error-handler',
] as const;

// 中间件配置类型
export interface MiddlewareConfig {
  enableErrorHandler: boolean;
  enableRequestLogger: boolean;
  enableRateLimiter: boolean;
  enableRequestValidator: boolean;
  enableSecurityHeaders: boolean;
  enableRequestId: boolean;
  enableResponseFormatter: boolean;
  enableCorsEnhanced: boolean;
}

// 默认中间件配置
export const DEFAULT_MIDDLEWARE_CONFIG: MiddlewareConfig = {
  enableErrorHandler: true,
  enableRequestLogger: true,
  enableRateLimiter: true,
  enableRequestValidator: true,
  enableSecurityHeaders: true,
  enableRequestId: true,
  enableResponseFormatter: true,
  enableCorsEnhanced: true,
};