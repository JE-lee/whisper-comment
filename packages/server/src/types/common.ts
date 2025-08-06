// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 排序参数
export interface SortParams<T = string> {
  sortBy?: T;
  sortOrder?: 'asc' | 'desc';
}

// API 响应基础结构
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  statusCode?: number;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// 列表响应结构
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}