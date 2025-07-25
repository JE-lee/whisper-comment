import { PaginationInfo } from '../types/common';

/**
 * 计算分页信息
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * 验证分页参数
 */
export function validatePaginationParams(
  page?: number,
  limit?: number
): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(100, Math.max(1, limit || 20));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}

/**
 * 计算跳过的记录数
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}