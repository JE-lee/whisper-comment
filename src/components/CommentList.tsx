import { MessageCircle } from 'lucide-preact'
import { clsx } from 'clsx'
import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'
import { CommentItem } from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  loading?: boolean
  onVote: (request: VoteRequest) => Promise<void>
  onReply: (request: CreateCommentRequest) => Promise<void>
}

export function CommentList({ comments, loading, onVote, onReply }: CommentListProps) {
  if (loading) {
    return (
      <div class="space-y-4">
        {/* 加载骨架屏 */}
        {[1, 2, 3].map((i) => (
          <div key={i} class="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div class="flex items-center space-x-2 mb-3">
              <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                <div class="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="h-4 bg-gray-300 rounded"></div>
              <div class="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="h-8 bg-gray-300 rounded w-16"></div>
              <div class="h-8 bg-gray-300 rounded w-16"></div>
              <div class="h-8 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div class="text-center py-12">
        <MessageCircle class="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">还没有评论</h3>
        <p class="text-gray-500">成为第一个发表评论的人吧！</p>
      </div>
    )
  }

  return (
    <div class="space-y-6">
      {/* 评论统计 */}
      <div class="flex items-center space-x-2">
        <MessageCircle class="h-5 w-5 text-gray-600" />
        <span class="text-lg font-medium text-gray-900">
          {comments.length} 条评论
        </span>
      </div>

      {/* 评论列表 */}
      <div class="space-y-6">
        {comments.map((comment, index) => (
          <div key={comment.id} class={clsx(
            index > 0 && 'pt-6 border-t border-gray-100'
          )}>
            <CommentItem
              comment={comment}
              onVote={onVote}
              onReply={onReply}
              depth={0}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 
