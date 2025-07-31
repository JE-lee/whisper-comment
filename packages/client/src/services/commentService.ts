import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'
import { IdentityService } from './identity'

// API 基础配置
const API_BASE_URL = 'http://localhost:3000/api'
const DEFAULT_SITE_ID = '550e8400-e29b-41d4-a716-446655440000' // 使用有效的UUID格式

// 获取当前用户token
const getUserToken = (): string => {
  let token = IdentityService.getUserToken()
  if (!token) {
    token = IdentityService.init()
  }
  return token
}

// 获取当前页面URL作为页面标识符（不包括query和hash部分）
const getCurrentPageIdentifier = (): string => {
  if (typeof window === 'undefined') {
    return 'default-page' // 服务端渲染时的默认值
  }
  
  const url = new URL(window.location.href)
  // 返回协议 + 主机 + 路径，不包括query和hash
  return `${url.protocol}//${url.host}${url.pathname}`
}

// API 响应类型
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ServerComment {
  commentId: string
  siteId: string
  pageIdentifier: string
  parentId: string | null
  authorNickname: string
  content: string
  status: number
  createdAt: string
  likes: number
  dislikes: number
  userAction: 'like' | 'dislike' | null
  replies?: ServerComment[]
}

interface CommentListResponse {
  comments: ServerComment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 转换服务端评论数据为客户端格式
const transformServerComment = (serverComment: ServerComment): Comment => {
  return {
    id: serverComment.commentId,
    content: serverComment.content,
    author: serverComment.authorNickname,
    timestamp: serverComment.createdAt,
    likes: serverComment.likes,
    dislikes: serverComment.dislikes,
    userAction: serverComment.userAction as 'like' | 'dislike' | null,
    parentId: serverComment.parentId,
    replies: serverComment.replies ? serverComment.replies.map(transformServerComment) : []
  }
}

// HTTP 请求工具函数
const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result: ApiResponse<T> = await response.json()
  
  if (!result.success) {
    throw new Error(result.message || 'API request failed')
  }

  return result.data
}

export const commentService = {
  // 获取所有评论
  async getComments(): Promise<Comment[]> {
    try {
      const params = new URLSearchParams({
        siteId: DEFAULT_SITE_ID,
        pageIdentifier: getCurrentPageIdentifier(),
        status: '0', // 获取待审核的评论（测试用）
        limit: '100', // 获取更多评论
        parentId: '' // 只获取顶级评论（parentId为null的评论）
        // 注意：不传递authorToken，这样能看到所有用户的评论
        // authorToken只在创建评论时使用
      })
      
      const response = await apiRequest<CommentListResponse>(`/comments?${params}`)
      // 只返回顶级评论，回复已经嵌套在replies字段中
      const topLevelComments = response.comments
        .filter(comment => comment.parentId === null)
        .map(transformServerComment)
      
      return topLevelComments
    } catch (_error) {
      return []
    }
  },

  // 创建新评论
  async createComment(request: CreateCommentRequest): Promise<Comment> {
    try {
      const createData = {
        siteId: DEFAULT_SITE_ID,
        pageIdentifier: getCurrentPageIdentifier(),
        parentId: request.parentId || undefined,
        authorToken: getUserToken(),
        authorNickname: request.author,
        content: request.content
      }
      

      
      const response = await apiRequest<ServerComment>('/comments', {
        method: 'POST',
        body: JSON.stringify(createData)
      })
      
      return transformServerComment(response)
    } catch (_error) {
      throw new Error('创建评论失败，请稍后重试')
    }
  },

  // 点赞/踩评论
  async voteComment(request: VoteRequest): Promise<{ commentId: string; likes: number; dislikes: number; userAction: string | null }> {
    try {
      const voteData = {
        action: request.action
        // 不再需要 authorToken
      }
      
      const response = await apiRequest<{ commentId: string; likes: number; dislikes: number; userAction: string | null }>(`/comments/${request.commentId}/vote`, {
        method: 'POST',
        body: JSON.stringify(voteData)
      })
      
      return response
    } catch (_error) {
      throw new Error('投票失败，请稍后重试')
    }
  }
}
