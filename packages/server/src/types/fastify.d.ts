import { PaginationInfo } from './api';

declare module 'fastify' {
  interface FastifyReply {
    success<T>(data: T, statusCode?: number): FastifyReply;
    error(code: string, message: string, statusCode?: number, details?: any): FastifyReply;
    paginated<T>(items: T[], pagination: PaginationInfo, statusCode?: number): FastifyReply;
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    requestId: string;
    traceData: {
      requestId?: string;
      method: string;
      url: string;
      userAgent?: string;
      ip: string;
      startTime: number;
    };
  }
}
