import { useState } from 'preact/hooks'
import { ThumbsUp, ThumbsDown, Reply, Clock, ChevronDown, ChevronRight } from './Icons'
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
  const [isExpanded, setIsExpanded] = useState(depth < 2) // 深度小于2时默认展开，深度>=2时默认收起
  const [isAnimating, setIsAnimating] = useState(false) // 动画状态

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

  // 递归计算总回复数量
  const getTotalRepliesCount = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + getTotalRepliesCount(comment.replies)
    }, 0)
  }

  // 获取总回复数量
  const totalReplies = getTotalRepliesCount(comment.replies)

  // 处理展开/收起动画
  const handleToggleExpanded = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setIsExpanded(!isExpanded)
    
    // 动画完成后重置状态
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
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

  // 获取缩进样式（使用固定类名）
  // const getIndentStyle = () => {
  //   if (depth === 0) return ''
  //   switch (depth) {
  //     case 1: return 'ml-8'
  //     case 2: return 'ml-16'
  //     case 3: return 'ml-24'
  //     default: return 'ml-32' // 最大缩进
  //   }
  // }

  return (
    <div class="w-full animate-fade-in">
      {/* 主评论或回复容器 */}
      <div class={clsx(
        'flex w-full',
        depth > 0 && 'mt-2'
      )}>
        {/* 左侧连接线区域 */}
        {depth > 0 && (
          <div class="flex-shrink-0 w-6 relative mr-2">
            {/* 垂直连接线 */}
            <div class="absolute left-3 top-0 bottom-0 w-0.5 animate-fade-in" style={{ background: 'var(--wc-border)' }}></div>
            {/* 水平连接线到评论 */}
            <div class="absolute left-3 top-6 w-3 h-0.5 animate-fade-in" style={{ background: 'var(--wc-border)' }}></div>
            {/* 圆点连接点 */}
            <div class="absolute left-2.5 top-6 w-1 h-1 rounded-full animate-fade-in" style={{ background: 'var(--wc-text-secondary)' }}></div>
          </div>
        )}
        {/* 评论内容区域 */}
        <div class="flex-1 min-w-0">
          {/* 评论主体 */}
          <div class="group rounded-lg border p-3 transition-all duration-200 hover:shadow-md" style={{ background: 'var(--wc-bg)', borderColor: 'var(--wc-border)' }}>
            {/* 作者和时间 */}
            <div class="flex items-start space-x-2 mb-2">
              <div class={clsx(
                'rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0',
                depth === 0 ? 'w-8 h-8' : 'w-7 h-7'
              )} style={{ background: depth === 0 ? 'linear-gradient(135deg, var(--wc-primary), var(--wc-primary-dark))' : 'linear-gradient(135deg, #6b7280, #374151)' }}>
                {comment.author.charAt(0)}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class={clsx(
                  'font-medium text-left',
                  depth > 0 && 'text-sm'
                )} style={{ color: 'var(--wc-text)' }}>{comment.author}</h4>
                <div class="flex items-center space-x-1 text-xs text-left" style={{ color: 'var(--wc-text-secondary)' }}>
                  <Clock class="h-3 w-3" />
                  <span>{formatTime(comment.timestamp)}</span>
                  {depth > 0 && <span>• 回复</span>}
                </div>
              </div>
            </div>
            {/* 评论内容 */}
            <div class="mb-3 text-left">
              <p class={clsx(
                'leading-relaxed whitespace-pre-wrap text-left',
                depth > 0 && 'text-sm'
              )} style={{ color: 'var(--wc-text)' }}>{comment.content}</p>
            </div>
            {/* 操作按钮 */}
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1 sm:space-x-2 text-left">
                {/* 点赞按钮 */}
                <button
                  onClick={() => handleVote('like')}
                  disabled={isVoting}
                  aria-label={`点赞 ${comment.likes} 次`}
                  title={`点赞 ${comment.likes} 次`}
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 px-1.5 sm:px-2 py-1 rounded text-sm font-medium transition-all duration-200',
                    comment.userAction === 'like'
                      ? ''
                      : '',
                    animateAction === 'like' && 'animate-like-bounce',
                    isVoting && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                  style={{ color: comment.userAction === 'like' ? 'var(--wc-primary)' : 'var(--wc-text-secondary)', background: comment.userAction === 'like' ? 'var(--wc-bg-secondary)' : 'transparent' }}
                >
                  <ThumbsUp class={clsx(
                    'h-4 w-4 transition-transform duration-200',
                    comment.userAction === 'like' && 'scale-110'
                  )} />
                  <span class="hidden sm:inline">{comment.likes}</span>
                </button>
                {/* 踩按钮 */}
                <button
                  onClick={() => handleVote('dislike')}
                  disabled={isVoting}
                  aria-label={`踩 ${comment.dislikes} 次`}
                  title={`踩 ${comment.dislikes} 次`}
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 px-1.5 sm:px-2 py-1 rounded text-sm font-medium transition-all duration-200',
                    comment.userAction === 'dislike'
                      ? ''
                      : '',
                    animateAction === 'dislike' && 'animate-dislike-bounce',
                    isVoting && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                  style={{ color: comment.userAction === 'dislike' ? 'var(--wc-danger)' : 'var(--wc-text-secondary)', background: comment.userAction === 'dislike' ? 'var(--wc-danger-bg)' : 'transparent' }}
                >
                  <ThumbsDown class={clsx(
                    'h-4 w-4 transition-transform duration-200',
                    comment.userAction === 'dislike' && 'scale-110'
                  )} />
                  <span class="hidden sm:inline">{comment.dislikes}</span>
                </button>
                {/* 回复按钮 */}
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  aria-label="回复评论"
                  title="回复评论"
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 px-1.5 sm:px-2 py-1 rounded text-sm font-medium transition-all duration-200',
                    showReplyForm && ''
                  )}
                  style={{ color: 'var(--wc-text-secondary)', background: showReplyForm ? 'var(--wc-bg-secondary)' : 'transparent' }}
                >
                  <Reply class="h-4 w-4" />
                  <span class="hidden sm:inline">回复</span>
                </button>
              </div>
              {/* 展开/收起按钮 */}
              {totalReplies > 0 && (
                <button
                  onClick={handleToggleExpanded}
                  disabled={isAnimating}
                  aria-label={isExpanded ? '收起回复' : `查看 ${totalReplies} 条回复`}
                  title={isExpanded ? '收起回复' : `查看 ${totalReplies} 条回复`}
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 px-1.5 sm:px-2 py-1 rounded text-sm font-medium transform focus:outline-none',
                    isAnimating && 'pointer-events-none opacity-70'
                  )}
                  style={{ color: 'var(--wc-text-secondary)', background: 'var(--wc-bg-secondary)' }}
                >
                  <div class={clsx(
                    'transition-transform duration-300 ease-in-out',
                    isExpanded ? 'rotate-180' : 'rotate-0'
                  )}>
                    <ChevronDown class="h-4 w-4" />
                  </div>
                  <span class="hidden sm:inline transition-all duration-200">
                    {isExpanded ? '收起回复' : `查看 ${totalReplies} 条回复`}
                  </span>
                </button>
              )}
            </div>
          </div>
          {/* 回复表单 */}
          {showReplyForm && (
            <div class="mt-2 animate-fade-in">
              <div class="transform transition-all duration-300 ease-out animate-slide-down">
                <CommentForm
                  onSubmit={handleReplySubmit}
                  parentId={comment.id}
                  placeholder={`回复 @${comment.author}...`}
                  onCancel={() => setShowReplyForm(false)}
                  isReply={true}
                />
              </div>
            </div>
          )}
          {/* 回复列表 */}
          {comment.replies.length > 0 && (
            <div class={clsx(
              "mt-1.5 overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded 
                ? "max-h-screen opacity-100 transform translate-y-0" 
                : "max-h-0 opacity-0 transform -translate-y-2"
            )}>
              <div class={clsx(
                "transition-all duration-300 ease-in-out",
                isExpanded ? "animate-fade-in" : "animate-fade-out"
              )}>
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
            </div>
          )}

          {/* 收起状态下的回复预览 */}
          {comment.replies.length > 0 && (
            <div class={clsx(
              "mt-1.5 overflow-hidden transition-all duration-300 ease-in-out",
              !isExpanded 
                ? "max-h-20 opacity-100 transform translate-y-0" 
                : "max-h-0 opacity-0 transform -translate-y-2"
            )}>
              <div class={clsx(
                "transition-all duration-300 ease-in-out",
                !isExpanded ? "animate-fade-in" : "animate-fade-out"
              )}>
                <button
                  onClick={handleToggleExpanded}
                  disabled={isAnimating}
                  aria-label={`展开 ${totalReplies} 条回复`}
                  title={`展开 ${totalReplies} 条回复`}
                  class={clsx(
                    "w-full flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 transform hover:scale-[1.01]",
                    isAnimating && "pointer-events-none opacity-70"
                  )}
                >
                  <div class="flex -space-x-1">
                    {comment.replies.slice(0, 3).map((reply, index) => (
                      <div
                        key={reply.id}
                        class={clsx(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white transition-transform duration-200 hover:scale-110',
                          'bg-gradient-to-br from-gray-400 to-gray-600',
                          index === 0 && 'z-30',
                          index === 1 && 'z-20', 
                          index === 2 && 'z-10'
                        )}
                      >
                        {reply.author.charAt(0)}
                      </div>
                    ))}
                    {comment.replies.length > 3 && (
                      <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-200 border-2 border-white transition-transform duration-200 hover:scale-110">
                        +{comment.replies.length - 3}
                      </div>
                    )}
                  </div>
                  <div class="flex-1 text-left">
                    <span class="text-left">
                      {comment.replies[0].author} 等 {totalReplies} 人参与了讨论
                    </span>
                  </div>
                  <div class="transition-transform duration-200 hover:translate-x-1">
                    <ChevronRight class="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
