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
  parentAuthor?: string // 新增：被回复者的名字
}

export function CommentItem({ comment, onVote, onReply, depth = 0, parentAuthor }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [animateAction, setAnimateAction] = useState<'like' | 'dislike' | null>(null)
  const [isExpanded, setIsExpanded] = useState(depth < 1) // 只有第一层默认展开
  const [isAnimating, setIsAnimating] = useState(false)

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

  // 递归获取所有回复（扁平化），同时保留父级信息
  const getAllRepliesWithParent = (comments: Comment[], parentAuthor: string): Array<Comment & { parentAuthor: string }> => {
    const allReplies: Array<Comment & { parentAuthor: string }> = []
    
    const collectReplies = (replies: Comment[], currentParentAuthor: string) => {
      replies.forEach(reply => {
        // 添加父级作者信息
        allReplies.push({ ...reply, parentAuthor: currentParentAuthor })
        if (reply.replies && reply.replies.length > 0) {
          // 递归时，当前回复的作者成为下一级的父级
          collectReplies(reply.replies, reply.author || '匿名用户')
        }
      })
    }
    
    collectReplies(comments, parentAuthor)
    return allReplies
  }

  // 获取所有回复（扁平化后的，带父级信息）
  const allRepliesWithParent = depth === 0 ? getAllRepliesWithParent(comment.replies, comment.author) : []
  const totalReplies = allRepliesWithParent.length

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
    } catch (_error) {
      // Ignore vote errors
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

  return (
    <div class="w-full animate-fade-in">
      {/* 主评论或回复容器 */}
      <div class={clsx(
        'flex w-full',
        depth > 0 && 'mt-2'
      )}>
        {/* 左侧连接线区域 - 只在第二层显示 */}
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
          {/* 评论主体 - 优化紧凑布局 */}
          <div class={clsx(
            "group border transition-all duration-200 hover:shadow-md",
            depth === 0 ? "p-3" : "p-2",
            // 根据是否有回复预览来决定圆角样式
            depth === 0 && allRepliesWithParent.length > 0 
              ? "rounded-t-lg border-b-0" 
              : "rounded-lg"
          )} style={{ background: 'var(--wc-bg)', borderColor: 'var(--wc-border)' }}>
            {/* 作者和时间 - 优化紧凑布局 */}
            <div class={clsx(
              "flex items-center space-x-2",
              depth === 0 ? "mb-2" : "mb-1.5"
            )}>
              <div class={clsx(
                'rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0',
                depth === 0 ? 'w-7 h-7' : 'w-6 h-6'
              )} style={{ background: depth === 0 ? 'linear-gradient(135deg, var(--wc-primary), var(--wc-primary-dark))' : 'linear-gradient(135deg, #6b7280, #374151)' }}>
                {comment.author?.charAt(0) || '?'}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                  <h4 class={clsx(
                    'font-medium text-left',
                    depth === 0 ? 'text-sm' : 'text-xs'
                  )} style={{ color: 'var(--wc-text)' }}>{comment.author || '匿名用户'}</h4>
                  {/* 时间显示 - 移到同一行 */}
                  <div class="flex items-center space-x-1 text-xs" style={{ color: 'var(--wc-text-secondary)' }}>
                    <Clock class="h-2.5 w-2.5" />
                    <span>{formatTime(comment.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 评论内容 - 优化间距 */}
            <div class={clsx(
              "text-left",
              depth === 0 ? "mb-2.5" : "mb-2"
            )}>
              <p class={clsx(
                'leading-relaxed whitespace-pre-wrap text-left',
                depth === 0 ? 'text-sm' : 'text-xs'
              )} style={{ color: 'var(--wc-text)' }}>
                {/* 显示回复关系 - 在内容前面 */}
                {depth > 0 && parentAuthor && (
                  <span class="text-xs mr-1" style={{ color: 'var(--wc-text-secondary)' }}>
                    回复 <span class="px-1 py-0.5 rounded" style={{ background: 'var(--wc-bg-secondary)', color: 'var(--wc-text)' }}>{parentAuthor}</span>
                  </span>
                )}
                {comment.content}
              </p>
            </div>
            {/* 操作按钮 - 优化紧凑布局 */}
            <div class="flex items-center justify-between">
              <div class={clsx(
                "flex items-center text-left",
                depth === 0 ? "space-x-1 sm:space-x-2" : "space-x-1"
              )}>
                {/* 点赞按钮 */}
                <button
                  onClick={() => handleVote('like')}
                  disabled={isVoting}
                  aria-label={`点赞 ${comment.likes} 次`}
                  title={`点赞 ${comment.likes} 次`}
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 rounded font-medium transition-all duration-200',
                    depth === 0 ? 'px-1.5 sm:px-2 py-1 text-sm' : 'px-1 py-0.5 text-xs',
                    animateAction === 'like' && 'animate-like-bounce',
                    isVoting && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                  style={{ color: comment.userAction === 'like' ? 'var(--wc-primary)' : 'var(--wc-text-secondary)', background: comment.userAction === 'like' ? 'var(--wc-bg-secondary)' : 'transparent' }}
                >
                  <ThumbsUp class={clsx(
                    'transition-transform duration-200',
                    depth === 0 ? 'h-4 w-4' : 'h-3 w-3',
                    comment.userAction === 'like' && 'scale-110'
                  )} />
                  <span class={clsx(
                    "hidden sm:inline",
                    depth > 0 && "text-xs"
                  )}>{comment.likes}</span>
                </button>
                {/* 踩按钮 */}
                <button
                  onClick={() => handleVote('dislike')}
                  disabled={isVoting}
                  aria-label={`踩 ${comment.dislikes} 次`}
                  title={`踩 ${comment.dislikes} 次`}
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 rounded font-medium transition-all duration-200',
                    depth === 0 ? 'px-1.5 sm:px-2 py-1 text-sm' : 'px-1 py-0.5 text-xs',
                    animateAction === 'dislike' && 'animate-dislike-bounce',
                    isVoting && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                  style={{ color: comment.userAction === 'dislike' ? 'var(--wc-danger)' : 'var(--wc-text-secondary)', background: comment.userAction === 'dislike' ? 'var(--wc-danger-bg)' : 'transparent' }}
                >
                  <ThumbsDown class={clsx(
                    'transition-transform duration-200',
                    depth === 0 ? 'h-4 w-4' : 'h-3 w-3',
                    comment.userAction === 'dislike' && 'scale-110'
                  )} />
                  <span class={clsx(
                    "hidden sm:inline",
                    depth > 0 && "text-xs"
                  )}>{comment.dislikes}</span>
                </button>
                {/* 回复按钮 */}
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  aria-label="回复评论"
                  title="回复评论"
                  class={clsx(
                    'flex items-center space-x-0 sm:space-x-1 rounded font-medium transition-all duration-200',
                    depth === 0 ? 'px-1.5 sm:px-2 py-1 text-sm' : 'px-1 py-0.5 text-xs'
                  )}
                  style={{ color: 'var(--wc-text-secondary)', background: showReplyForm ? 'var(--wc-bg-secondary)' : 'transparent' }}
                >
                  <Reply class={clsx(
                    depth === 0 ? 'h-4 w-4' : 'h-3 w-3'
                  )} />
                  <span class={clsx(
                    "hidden sm:inline",
                    depth > 0 && "text-xs"
                  )}>回复</span>
                </button>
              </div>
              {/* 展开/收起按钮 - 只在第一层且有回复时显示 */}
              {depth === 0 && totalReplies > 0 && (
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
                  placeholder={`回复 @${comment.author || '匿名用户'}...`}
                  onCancel={() => setShowReplyForm(false)}
                  isReply={true}
                />
              </div>
            </div>
          )}
          
          {/* 回复列表 - 只在第一层显示，且将所有回复扁平化显示 */}
          {depth === 0 && allRepliesWithParent.length > 0 && (
            <div class={clsx(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded 
                ? "max-h-screen opacity-100 transform translate-y-0" 
                : "max-h-0 opacity-0 transform -translate-y-2"
            )}>
              <div class={clsx(
                "transition-all duration-300 ease-in-out",
                isExpanded ? "animate-fade-in" : "animate-fade-out"
              )}>
                {allRepliesWithParent.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onVote={onVote}
                    onReply={onReply}
                    depth={1}
                    parentAuthor={reply.parentAuthor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 收起状态下的回复预览 - 只在第一层显示 */}
          {depth === 0 && allRepliesWithParent.length > 0 && (
            <div class={clsx(
              "overflow-hidden transition-all duration-300 ease-in-out",
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
                    "w-full flex items-center space-x-2 text-sm rounded-b-lg p-3 border-t-0 border transition-all duration-200 transform",
                    isAnimating && "pointer-events-none opacity-70"
                  )}
                  style={{
                    background: 'var(--wc-bg-secondary)',
                    borderColor: 'var(--wc-border)',
                    color: 'var(--wc-text-secondary)'
                  }}
                >
                  <div class="flex -space-x-1">
                    {allRepliesWithParent.slice(0, 3).map((reply, index) => (
                      <div
                        key={reply.id}
                        class={clsx(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 transition-transform duration-200 hover:scale-110',
                          'bg-gradient-to-br from-gray-400 to-gray-600',
                          index === 0 && 'z-30',
                          index === 1 && 'z-20', 
                          index === 2 && 'z-10'
                        )}
                        style={{ borderColor: 'var(--wc-bg-secondary)' }}
                      >
                        {reply.author?.charAt(0) || '?'}
                      </div>
                    ))}
                    {allRepliesWithParent.length > 3 && (
                      <div 
                        class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-transform duration-200 hover:scale-110"
                        style={{ 
                          borderColor: 'var(--wc-bg-secondary)',
                          background: 'var(--wc-border)',
                          color: 'var(--wc-text-secondary)'
                        }}
                      >
                        +{allRepliesWithParent.length - 3}
                      </div>
                    )}
                  </div>
                  <div class="flex-1 text-left">
                    <span class="text-left">
                      {allRepliesWithParent[0].author || '匿名用户'} 等 {totalReplies} 人参与了讨论
                    </span>
                  </div>
                  <div class="transition-transform duration-200 hover:translate-x-1">
                    <ChevronRight class="h-4 w-4" style={{ color: 'var(--wc-text-secondary)' }} />
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
