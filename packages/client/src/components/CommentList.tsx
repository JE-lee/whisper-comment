import { MessageCircle } from './Icons'
import { clsx } from 'clsx'
import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'
import { CommentItem } from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  loading?: boolean
  onVote: (request: VoteRequest) => Promise<void>
  onReply: (request: CreateCommentRequest) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
}

export function CommentList({ comments, loading, onVote, onReply, onEdit, onDelete }: CommentListProps) {
  if (loading) {
    return (
      <div class="space-y-4">
        {/* 加载骨架屏 */}
        {[1, 2, 3].map((i) => (
          <div key={i} class="rounded-lg border p-4 animate-pulse" style={{ background: 'var(--wc-bg)', borderColor: 'var(--wc-border)' }}>
            <div class="flex items-center space-x-2 mb-3">
              <div class="w-8 h-8 rounded-full" style={{ background: 'var(--wc-bg-secondary)' }}></div>
              <div class="flex-1">
                <div class="h-4 rounded w-24 mb-1" style={{ background: 'var(--wc-bg-secondary)' }}></div>
                <div class="h-3 rounded w-16" style={{ background: 'var(--wc-bg-secondary)' }}></div>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="h-4 rounded" style={{ background: 'var(--wc-bg-secondary)' }}></div>
              <div class="h-4 rounded w-3/4" style={{ background: 'var(--wc-bg-secondary)' }}></div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="h-8 rounded w-16" style={{ background: 'var(--wc-bg-secondary)' }}></div>
              <div class="h-8 rounded w-16" style={{ background: 'var(--wc-bg-secondary)' }}></div>
              <div class="h-8 rounded w-16" style={{ background: 'var(--wc-bg-secondary)' }}></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div class="text-center py-12">
        <MessageCircle class="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--wc-text-secondary)' }} />
        <h3 class="text-lg font-medium mb-2" style={{ color: 'var(--wc-text)' }}>还没有评论</h3>
        <p style={{ color: 'var(--wc-text-secondary)' }}>成为第一个发表评论的人吧！</p>
      </div>
    )
  }

  return (
    <div class="space-y-4">
      {/* 评论统计 */}
      <div class="flex items-center space-x-2">
        <MessageCircle class="h-5 w-5" style={{ color: 'var(--wc-text-secondary)' }} />
        <span class="text-lg font-medium" style={{ color: 'var(--wc-text)' }}>
          {comments.length} 条评论
        </span>
      </div>

      {/* 评论列表 */}
      <div class="space-y-2">
        {comments.map((comment, index) => (
          <div key={comment.id} class={clsx(
            index > 0 && 'pt-2 border-t border-gray-100'
          )}>
            <CommentItem
              comment={comment}
              onVote={onVote}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
