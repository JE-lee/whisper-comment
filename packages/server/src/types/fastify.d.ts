import { FastifyReply } from 'fastify';
import { ApiResponse, ListResponse, PaginationInfo } from './api';

declare module 'fastify' {
  interface FastifyReply {
    success<T>(data: T, statusCode?: number): FastifyReply;
    error(code: string, message: string, statusCode?: number, details?: any): FastifyReply;
    paginated<T>(items: T[], pagination: PaginationInfo, statusCode?: number): FastifyReply;
  }
}