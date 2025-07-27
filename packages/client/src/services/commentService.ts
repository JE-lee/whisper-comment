import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'

// API 基础配置
const API_BASE_URL = 'http://localhost:3000/api'
const DEFAULT_SITE_ID = '550e8400-e29b-41d4-a716-446655440000' // 使用有效的UUID格式
const DEFAULT_PAGE_IDENTIFIER = 'test-page'
const DEFAULT_AUTHOR_TOKEN = 'anonymous-user-token'

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
    likes: 0, // 暂时设为0，后续可以从服务端获取
    dislikes: 0,
    userAction: null,
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
        pageIdentifier: DEFAULT_PAGE_IDENTIFIER,
        status: '0', // 获取待审核的评论（测试用）
        limit: '100', // 获取更多评论
        parentId: '' // 只获取顶级评论（parentId为null的评论）
      })
      
      const response = await apiRequest<CommentListResponse>(`/comments?${params}`)
      // 只返回顶级评论，回复已经嵌套在replies字段中
      const topLevelComments = response.comments
        .filter(comment => comment.parentId === null)
        .map(transformServerComment)
      
      return topLevelComments
    } catch (error) {
      console.error('获取评论失败:', error)
      return []
    }
  },

  // 创建新评论
  async createComment(request: CreateCommentRequest): Promise<Comment> {
    try {
      const createData = {
        siteId: DEFAULT_SITE_ID,
        pageIdentifier: DEFAULT_PAGE_IDENTIFIER,
        parentId: request.parentId || undefined,
        authorToken: DEFAULT_AUTHOR_TOKEN,
        authorNickname: request.author,
        content: request.content
      }
      
      const response = await apiRequest<ServerComment>('/comments', {
        method: 'POST',
        body: JSON.stringify(createData)
      })
      
      return transformServerComment(response)
    } catch (error) {
      console.error('创建评论失败:', error)
      throw new Error('创建评论失败，请稍后重试')
    }
  },

  // 点赞/踩评论 (暂时保留mock实现，因为服务端还没有相关接口)
  async voteComment(request: VoteRequest): Promise<Comment> {
    // 这里暂时返回一个模拟的结果
    // 实际应该调用服务端的投票API
    console.warn('投票功能暂未实现服务端接口')
    throw new Error('投票功能暂未实现')
  }
}
