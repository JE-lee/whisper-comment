import { z } from 'zod';
import { CommentStatus } from '../types/comment';

// 评论列表查询参数验证
export const commentListQuerySchema = z.object({
  siteId: z.string().uuid('Invalid site ID format'),
  pageIdentifier: z.string().optional(),
  status: z.nativeEnum(CommentStatus).optional(),
  authorToken: z.string().optional(),
  parentId: z.string().uuid('Invalid parent ID format').nullable().optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(20),
  sortBy: z.enum(['createdAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// 评论 ID 参数验证
export const commentIdParamSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID format'),
});

// 站点 ID 参数验证
export const siteIdParamSchema = z.object({
  siteId: z.string().uuid('Invalid site ID format'),
});

// 页面统计查询参数验证
export const pageStatsQuerySchema = z.object({
  siteId: z.string().uuid('Invalid site ID format'),
  pageIdentifier: z.string().min(1, 'Page identifier is required'),
});

// 批量审核请求体验证
export const moderateCommentsSchema = z.object({
  commentIds: z.array(z.string().uuid('Invalid comment ID format')).min(1, 'At least one comment ID is required'),
  status: z.nativeEnum(CommentStatus, {
    error: () => ({ message: 'Invalid comment status' }),
  }),
});

// 创建评论请求体验证
export const createCommentSchema = z.object({
  siteId: z.string().uuid('Invalid site ID format'),
  pageIdentifier: z.string().min(1, 'Page identifier is required').max(500, 'Page identifier too long'),
  parentId: z.string().uuid('Invalid parent ID format').optional(),
  authorToken: z.string().min(1, 'Author token is required'),
  authorNickname: z.string().min(1, 'Author nickname is required').max(50, 'Nickname too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
});

// 更新评论请求体验证
export const updateCommentSchema = z.object({
  authorNickname: z.string().min(1, 'Author nickname is required').max(50, 'Nickname too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  status: z.nativeEnum(CommentStatus).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

// 导出类型
export type CommentListQueryInput = z.infer<typeof commentListQuerySchema>;
export type CommentIdParamInput = z.infer<typeof commentIdParamSchema>;
export type SiteIdParamInput = z.infer<typeof siteIdParamSchema>;
export type PageStatsQueryInput = z.infer<typeof pageStatsQuerySchema>;
export type ModerateCommentsInput = z.infer<typeof moderateCommentsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;