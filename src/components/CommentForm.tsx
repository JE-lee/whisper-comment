import { useState } from 'preact/hooks'
import { Send, User } from 'lucide-preact'
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
    } catch (error) {
      console.error('提交评论失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit}
      class={clsx(
        'space-y-4',
        isReply 
          ? 'bg-gray-50 p-4 rounded-lg border border-gray-200' 
          : 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm'
      )}
    >
      {/* 作者输入框 */}
      {(showAuthorInput || isReply) && (
        <div class="relative">
          <User class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={author}
            onInput={(e) => setAuthor((e.target as HTMLInputElement).value)}
            placeholder="请输入您的昵称"
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-500"
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
          class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none placeholder-gray-500"
          required
        />
      </div>

      {/* 按钮组 */}
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          {content.length}/500 字符
        </div>
        
        <div class="flex space-x-3">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              取消
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || content.length > 500}
            class="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Send class="h-4 w-4" />
            <span>{isSubmitting ? '发布中...' : (isReply ? '回复' : '发布评论')}</span>
          </button>
        </div>
      </div>
    </form>
  )
} 
