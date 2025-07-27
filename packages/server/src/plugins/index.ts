/**
 * 插件统一导出文件
 * 提供所有插件的统一入口
 */

// 错误处理插件
export { errorHandlerPlugin } from './error-handler';

// 请求日志插件
export { requestLoggerPlugin } from './request-logger';

// 速率限制插件
export { 
  rateLimiterPlugin, 
  createCustomRateLimit 
} from './rate-limiter';

// 请求验证插件
export { 
  requestValidatorPlugin,
  validatePaginationHook,
  validateSortHook
} from './request-validator';

// 安全头插件
export { 
  securityHeadersPlugin,
  developmentSecurityHeadersPlugin
} from './security-headers';

// 请求ID插件
export { 
  requestIdPlugin,
  requestTracingPlugin,
  getCurrentRequestId,
  generateCorrelationId
} from './request-id';

// 响应格式化插件
export { 
  responseFormatterPlugin,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse
} from './response-formatter';

// CORS增强插件
export { 
  corsEnhancedPlugin,
  developmentCorsPlugin,
  productionCorsPlugin
} from './cors-enhanced';

// 插件注册顺序配置
export const PLUGIN_ORDER = [
  'security-headers',
  'cors-enhanced', 
  'request-id',
  'request-logger',
  'rate-limiter',
  'request-validator',
  'response-formatter',
  'error-handler',
] as const;

// 插件配置类型
export interface PluginConfig {
  enableErrorHandler: boolean;
  enableRequestLogger: boolean;
  enableRateLimiter: boolean;
  enableRequestValidator: boolean;
  enableSecurityHeaders: boolean;
  enableRequestId: boolean;
  enableResponseFormatter: boolean;
  enableCorsEnhanced: boolean;
}

// 默认插件配置
export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
  enableErrorHandler: true,
  enableRequestLogger: true,
  enableRateLimiter: true,
  enableRequestValidator: true,
  enableSecurityHeaders: true,
  enableRequestId: true,
  enableResponseFormatter: true,
  enableCorsEnhanced: true,
};