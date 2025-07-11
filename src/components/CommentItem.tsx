import { useState } from 'preact/hooks'
import { ThumbsUp, ThumbsDown, Reply, Clock } from 'lucide-preact'
import { clsx } from 'clsx'
import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'
import { CommentForm } from './CommentForm'

interface CommentItemProps {
  comment: Comment
  onVote: (request: VoteRequest) => Promise<void>
  onReply: (request: CreateCommentRequest) => Promise<void>
  depth?: number
}

export function CommentItem({ comment, onVote, onReply, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [animateAction, setAnimateAction] = useState<'like' | 'dislike' | null>(null)

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return date.toLocaleDateString()
  }

  // 处理点赞/踩
  const handleVote = async (action: 'like' | 'dislike') => {
    if (isVoting) return

    setIsVoting(true)
    setAnimateAction(action)

    try {
      await onVote({
        commentId: comment.id,
        action
      })
    } catch (error) {
      console.error('投票失败:', error)
    } finally {
      setIsVoting(false)
      // 动画持续一点时间后清除
      setTimeout(() => setAnimateAction(null), 300)
    }
  }

  // 处理回复提交
  const handleReplySubmit = async (request: CreateCommentRequest) => {
    await onReply({
      ...request,
      parentId: comment.id
    })
    setShowReplyForm(false)
  }

  // 计算缩进样式
  const getIndentClass = () => {
    if (depth === 0) return ''
    const indent = Math.min(depth * 16, 64) // 最大缩进 4rem
    return `ml-${indent/4}`
  }

  return (
    <div class={clsx('space-y-4', depth > 0 && 'mt-4')}>
      {/* 评论主体 */}
      <div class={clsx(
        'group relative bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md',
        depth > 0 && getIndentClass()
      )}>
        {/* 作者和时间 */}
        <div class="flex items-center space-x-2 mb-3">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.author.charAt(0)}
          </div>
          <div class="flex-1">
            <h4 class="font-medium text-gray-900">{comment.author}</h4>
            <div class="flex items-center space-x-1 text-xs text-gray-500">
              <Clock class="h-3 w-3" />
              <span>{formatTime(comment.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* 评论内容 */}
        <div class="mb-4">
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>

        {/* 操作按钮 */}
        <div class="flex items-center space-x-4">
          {/* 点赞按钮 */}
          <button
            onClick={() => handleVote('like')}
            disabled={isVoting}
            class={clsx(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              comment.userAction === 'like'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600',
              animateAction === 'like' && 'animate-like-bounce',
              isVoting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ThumbsUp class={clsx(
              'h-4 w-4 transition-transform duration-200',
              comment.userAction === 'like' && 'scale-110'
            )} />
            <span>{comment.likes}</span>
          </button>

          {/* 踩按钮 */}
          <button
            onClick={() => handleVote('dislike')}
            disabled={isVoting}
            class={clsx(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              comment.userAction === 'dislike'
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-red-600',
              animateAction === 'dislike' && 'animate-dislike-bounce',
              isVoting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ThumbsDown class={clsx(
              'h-4 w-4 transition-transform duration-200',
              comment.userAction === 'dislike' && 'scale-110'
            )} />
            <span>{comment.dislikes}</span>
          </button>

          {/* 回复按钮 */}
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
          >
            <Reply class="h-4 w-4" />
            <span>回复</span>
          </button>
        </div>

        {/* 连接线（用于显示层级关系） */}
        {depth > 0 && (
          <div class="absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        )}
      </div>

      {/* 回复表单 */}
      {showReplyForm && (
        <div class={clsx('transition-all duration-200', depth > 0 && getIndentClass())}>
          <CommentForm
            onSubmit={handleReplySubmit}
            parentId={comment.id}
            placeholder={`回复 @${comment.author}...`}
            onCancel={() => setShowReplyForm(false)}
            isReply={true}
          />
        </div>
      )}

      {/* 回复列表 */}
      {comment.replies.length > 0 && (
        <div class="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
} 
