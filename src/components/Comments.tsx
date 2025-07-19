import { useState, useEffect } from 'preact/hooks'
import { Loader2, AlertCircle } from './Icons'
import type { Comment, CreateCommentRequest, VoteRequest } from '../types/comment'
import { commentService } from '../services/commentService'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'

interface CommentsProps {
  className?: string
  title?: string
}

export function Comments({ className = '', title = '评论区' }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载评论列表
  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await commentService.getComments()
      setComments(data)
    } catch (err) {
      console.error('加载评论失败:', err)
      setError('加载评论失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 创建新评论
  const handleCreateComment = async (request: CreateCommentRequest) => {
    try {
      const newComment = await commentService.createComment(request)
      
      if (request.parentId) {
        // 这是回复，需要更新对应评论的回复列表
        setComments(prevComments => 
          updateCommentsWithReply(prevComments, request.parentId!, newComment)
        )
      } else {
        // 这是顶级评论，直接添加到列表
        setComments(prevComments => [...prevComments, newComment])
      }
    } catch (err) {
      console.error('创建评论失败:', err)
      throw new Error('发布评论失败，请稍后重试')
    }
  }

  // 处理点赞/踩
  const handleVote = async (request: VoteRequest) => {
    try {
      const updatedComment = await commentService.voteComment(request)
      setComments(prevComments => 
        updateCommentInList(prevComments, updatedComment)
      )
    } catch (err) {
      console.error('投票失败:', err)
      throw new Error('投票失败，请稍后重试')
    }
  }

  // 递归更新评论列表中的特定评论
  const updateCommentInList = (comments: Comment[], updatedComment: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === updatedComment.id) {
        return updatedComment
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInList(comment.replies, updatedComment)
        }
      }
      return comment
    })
  }

  // 递归添加回复到评论列表
  const updateCommentsWithReply = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, newReply]
        }
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentsWithReply(comment.replies, parentId, newReply)
        }
      }
      return comment
    })
  }

  // 组件挂载时加载评论
  useEffect(() => {
    loadComments()
  }, [])

  return (
    <div class={`max-w-4xl mx-auto ${className}`}>
      {/* 标题 */}
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <div class="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p class="text-red-700 font-medium">{error}</p>
            <button
              onClick={loadComments}
              class="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              重新加载
            </button>
          </div>
        </div>
      )}

      {/* 评论表单 */}
      <div class="mb-6">
        <CommentForm onSubmit={handleCreateComment} />
      </div>

      {/* 评论列表 */}
      <div>
        {loading && !error ? (
          <div class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span class="text-gray-600">加载评论中...</span>
          </div>
        ) : (
          <CommentList
            comments={comments}
            loading={loading}
            onVote={handleVote}
            onReply={handleCreateComment}
          />
        )}
      </div>
    </div>
  )
} 
