import { Prisma } from '@prisma/client';

// Comment 状态枚举
export enum CommentStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  SPAM = 3,
}

// 使用 Prisma 的类型工具创建包含关联数据的类型
export type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    site: true;
    parent: true;
    replies: {
      include: {
        replies: true;
      };
    };
  };
}>;

// 用于 API 响应的 Comment 类型（隐藏敏感信息）
export interface CommentResponse {
  commentId: string;
  siteId: string;
  pageIdentifier: string;
  parentId: string | null;
  authorNickname: string;
  content: string;
  status: CommentStatus;
  likes: number;
  dislikes: number;
  userAction: VoteType | null; // 当前用户的投票状态
  createdAt: Date;
  replies: CommentResponse[];
}

// Comment 列表查询参数
export interface CommentListQuery {
  siteId: string;
  pageIdentifier?: string;
  status?: CommentStatus;
  authorToken?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Comment 列表响应
export interface CommentListResponse {
  comments: CommentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Comment 创建数据
export interface CreateCommentData {
  siteId: string;
  pageIdentifier: string;
  parentId?: string;
  authorToken: string;
  authorNickname: string;
  content: string;
}

// Comment 更新数据
export interface UpdateCommentData {
  authorNickname?: string;
  content?: string;
  status?: CommentStatus;
}

// 投票类型枚举
export enum VoteType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

// 投票请求数据
export interface VoteCommentData {
  commentId: string;
  authorToken: string;
  voteType: VoteType;
}

// 投票响应数据
export interface VoteResponse {
  commentId: string;
  likes: number;
  dislikes: number;
  userAction: VoteType | null;
}