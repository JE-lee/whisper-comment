import { useState } from 'preact/hooks'
import { Send, User } from './Icons'
import { clsx } from 'clsx'
import type { CreateCommentRequest } from '../types/comment'

interface CommentFormProps {
  onSubmit: (request: CreateCommentRequest) => Promise<void>
  parentId?: string
  placeholder?: string
  onCancel?: () => void
  isReply?: boolean
}

export function CommentForm({ onSubmit, parentId, placeholder = "写下你的评论...", onCancel, isReply = false }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAuthorInput, setShowAuthorInput] = useState(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    if (!author.trim()) {
      setShowAuthorInput(true)
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit({
        content: content.trim(),
        author: author.trim(),
        parentId
      })
      
      setContent('')
      if (!isReply) {
        setAuthor('')
        setShowAuthorInput(false)
      }
      if (onCancel) onCancel()
    } catch (_error) {
      // Ignore submit errors
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit}
      class={clsx(
        'space-y-3',
        isReply 
          ? 'p-3 rounded-lg border' 
          : 'border rounded-xl p-4 shadow-sm'
      )}
      style={{ background: isReply ? 'var(--wc-bg-secondary)' : 'var(--wc-bg)', borderColor: 'var(--wc-border)' }}
    >
      {/* 作者输入框 */}
      {(showAuthorInput || isReply) && (
        <div class="relative">
          <User class="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--wc-text-secondary)' }} />
          <input
            type="text"
            value={author}
            onInput={(e) => setAuthor((e.target as HTMLInputElement).value)}
            placeholder="请输入您的昵称"
            class="w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors duration-200"
            style={{ borderColor: 'var(--wc-border)', color: 'var(--wc-text)', background: 'var(--wc-bg-secondary)' }}
            required
          />
        </div>
      )}
      {/* 评论内容输入框 */}
      <div class="relative">
        <textarea
          value={content}
          onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          placeholder={placeholder}
          rows={isReply ? 3 : 4}
          class="w-full p-3 border rounded-lg transition-colors duration-200 resize-none"
          style={{ borderColor: 'var(--wc-border)', color: 'var(--wc-text)', background: 'var(--wc-bg-secondary)' }}
          required
        />
      </div>
      {/* 按钮组 */}
      <div class="flex items-center justify-between">
        <div class="text-sm" style={{ color: 'var(--wc-text-secondary)' }}>
          {content.length}/500 字符
        </div>
        <div class="flex space-x-2">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              class="px-3 py-2 transition-colors duration-200"
              style={{ color: 'var(--wc-text-secondary)' }}
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || content.length > 500}
            class="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:ring-2 focus:ring-offset-2"
            style={{ background: 'var(--wc-primary)', color: '#fff', opacity: isSubmitting || !content.trim() || content.length > 500 ? 0.5 : 1 }}
          >
            <Send class="h-4 w-4" />
            <span>{isSubmitting ? '发布中...' : (isReply ? '回复' : '发布评论')}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
