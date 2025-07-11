import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'

// Mock 数据存储
let mockComments: Comment[] = [
  {
    id: '1',
    content: '这是一个很棒的功能！期待后续的更新。',
    author: '张小明',
    timestamp: '2024-01-15T10:30:00Z',
    likes: 12,
    dislikes: 2,
    userAction: null,
    parentId: null,
    replies: [
      {
        id: '2',
        content: '我也这么认为，界面设计得很不错。',
        author: '李华',
        timestamp: '2024-01-15T11:15:00Z',
        likes: 5,
        dislikes: 0,
        userAction: null,
        parentId: '1',
        replies: []
      }
    ]
  },
  {
    id: '3',
    content: '有一个小 bug，在手机端显示不太正常。',
    author: '王二狗',
    timestamp: '2024-01-15T12:45:00Z',
    likes: 3,
    dislikes: 1,
    userAction: null,
    parentId: null,
    replies: []
  }
]

// 生成唯一 ID
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// 递归查找评论
const findCommentById = (comments: Comment[], id: string): Comment | null => {
  for (const comment of comments) {
    if (comment.id === id) return comment
    const found = findCommentById(comment.replies, id)
    if (found) return found
  }
  return null
}

// 递归添加回复
const addReplyToComment = (comments: Comment[], parentId: string, newComment: Comment): boolean => {
  for (const comment of comments) {
    if (comment.id === parentId) {
      comment.replies.push(newComment)
      return true
    }
    if (addReplyToComment(comment.replies, parentId, newComment)) {
      return true
    }
  }
  return false
}

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const commentService = {
  // 获取所有评论
  async getComments(): Promise<Comment[]> {
    await delay(300)
    return [...mockComments]
  },

  // 创建新评论
  async createComment(request: CreateCommentRequest): Promise<Comment> {
    await delay(500)
    
    const newComment: Comment = {
      id: generateId(),
      content: request.content,
      author: request.author,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      userAction: null,
      parentId: request.parentId || null,
      replies: []
    }

    if (request.parentId) {
      // 这是一个回复
      addReplyToComment(mockComments, request.parentId, newComment)
    } else {
      // 这是一个顶级评论
      mockComments.push(newComment)
    }

    return newComment
  },

  // 点赞/踩评论
  async voteComment(request: VoteRequest): Promise<Comment> {
    await delay(200)
    
    const comment = findCommentById(mockComments, request.commentId)
    if (!comment) {
      throw new Error('评论不存在')
    }

    // 处理投票逻辑
    if (comment.userAction === request.action) {
      // 取消投票
      if (request.action === 'like') {
        comment.likes--
      } else {
        comment.dislikes--
      }
      comment.userAction = null
    } else {
      // 切换或新增投票
      if (comment.userAction === 'like') {
        comment.likes--
      } else if (comment.userAction === 'dislike') {
        comment.dislikes--
      }

      if (request.action === 'like') {
        comment.likes++
      } else {
        comment.dislikes++
      }
      comment.userAction = request.action
    }

    return comment
  }
} 
