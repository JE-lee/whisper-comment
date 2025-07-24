export interface Comment {
  id: string
  content: string
  author: string
  timestamp: string
  likes: number
  dislikes: number
  userAction: 'like' | 'dislike' | null
  parentId: string | null
  replies: Comment[]
}

export interface CreateCommentRequest {
  content: string
  author: string
  parentId?: string
}

export interface VoteRequest {
  commentId: string
  action: 'like' | 'dislike'
} 
