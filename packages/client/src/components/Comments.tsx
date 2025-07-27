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
      const voteResult = await commentService.voteComment(request)
      updateCommentVotes(voteResult)
    } catch (_err) {
      // 可以在这里添加错误提示
    }
  }

  // 更新评论列表中的特定评论的投票信息
  const updateCommentVotes = (voteResult: { commentId: string; likes: number; dislikes: number; userAction: string | null }): void => {
    const updateComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === voteResult.commentId) {
          return {
            ...comment,
            likes: voteResult.likes,
            dislikes: voteResult.dislikes,
            userAction: voteResult.userAction
          }
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateComments(comment.replies)
          }
        }
        return comment
      })
    }
    
    setComments(prevComments => updateComments(prevComments))
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
    <div class={`max-w-4xl mx-auto ${className}`} style={{ background: 'var(--wc-bg)', color: 'var(--wc-text)', borderColor: 'var(--wc-border)' }}>
      {/* 标题 */}
      <div class="mb-6">
        <h2 class="text-2xl font-bold mb-2" style={{ color: 'var(--wc-text)' }}>{title}</h2>
        <div class="h-1 w-20 rounded-full" style={{ background: 'linear-gradient(to right, var(--wc-primary), var(--wc-primary-dark))' }}></div>
      </div>
      {/* 错误提示 */}
      {error && (
        <div class="mb-6 p-4 rounded-lg flex items-center space-x-3" style={{ background: 'var(--wc-danger-bg)', borderColor: 'var(--wc-danger-border)' }}>
          <AlertCircle class="h-5 w-5 flex-shrink-0" style={{ color: 'var(--wc-danger)' }} />
          <div>
            <p class="font-medium" style={{ color: 'var(--wc-danger)' }}>{error}</p>
            <button
              onClick={loadComments}
              class="text-sm underline mt-1"
              style={{ color: 'var(--wc-danger)', textDecorationColor: 'var(--wc-danger)' }}
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
            <Loader2 class="h-8 w-8 animate-spin mr-3" style={{ color: 'var(--wc-primary)' }} />
            <span style={{ color: 'var(--wc-text-secondary)' }}>加载评论中...</span>
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
