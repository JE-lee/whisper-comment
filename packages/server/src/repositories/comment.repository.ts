import { PrismaClient, Comment, Prisma } from '@prisma/client';
import { CommentListQuery, CommentWithRelations, CreateCommentData, UpdateCommentData, VoteCommentData, VoteType } from '../types/comment';
import { PaginationParams } from '../types/common';

export class CommentRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 根据查询条件获取评论列表
   */
  async findMany(query: CommentListQuery & PaginationParams): Promise<{
    comments: CommentWithRelations[];
    total: number;
  }> {
    const {
      siteId,
      pageIdentifier,
      status,
      authorToken,
      parentId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // 构建查询条件
    const where: Prisma.CommentWhereInput = {
      siteId,
      ...(pageIdentifier && { pageIdentifier }),
      ...(status !== undefined && { status }),
      ...(authorToken && { authorToken }),
      // 处理parentId：空字符串表示查询顶级评论（parentId为null）
      ...(parentId !== undefined && { 
        parentId: parentId === '' ? null : parentId 
      }),
    };

    // 构建排序条件
    const orderBy: Prisma.CommentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // 计算分页
    const skip = (page - 1) * limit;

    // 执行查询
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          site: true,
          parent: true,
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              replies: true, // 支持嵌套回复
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { comments, total };
  }

  /**
   * 根据 ID 获取单个评论
   */
  async findById(commentId: string): Promise<CommentWithRelations | null> {
    return this.prisma.comment.findUnique({
      where: { commentId },
      include: {
        site: true,
        parent: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            replies: true,
          },
        },
      },
    });
  }

  /**
   * 创建新评论
   */
  async create(data: CreateCommentData): Promise<Comment> {
    return this.prisma.comment.create({
      data,
    });
  }

  /**
   * 更新评论
   */
  async update(commentId: string, data: UpdateCommentData): Promise<Comment> {
    return this.prisma.comment.update({
      where: { commentId },
      data,
    });
  }

  /**
   * 删除评论
   */
  async delete(commentId: string): Promise<Comment> {
    return this.prisma.comment.delete({
      where: { commentId },
    });
  }

  /**
   * 获取评论的回复数量
   */
  async getReplyCount(commentId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { parentId: commentId },
    });
  }

  /**
   * 批量更新评论状态
   */
  async updateStatus(commentIds: string[], status: number): Promise<number> {
    const result = await this.prisma.comment.updateMany({
      where: {
        commentId: {
          in: commentIds,
        },
      },
      data: { status },
    });
    return result.count;
  }

  /**
   * 获取指定页面的评论统计信息
   */
  async getPageStats(siteId: string, pageIdentifier: string) {
    const stats = await this.prisma.comment.groupBy({
      by: ['status'],
      where: {
        siteId,
        pageIdentifier,
      },
      _count: {
        status: true,
      },
    });

    return stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      },
      { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>
    );
  }

  /**
   * 对评论进行投票
   * 简化版本：每次投票都直接增加计数，不检查重复投票
   */
  async voteComment(data: VoteCommentData): Promise<Comment> {
    const { commentId, voteType } = data;

    // 直接更新评论的投票计数，不检查重复投票
    const updateData = voteType === VoteType.LIKE 
      ? { likes: { increment: 1 } }
      : { dislikes: { increment: 1 } };

    return this.prisma.comment.update({
      where: { commentId },
      data: updateData,
    });
  }

  /**
   * 获取用户对评论的投票状态
   */
  async getUserVote(commentId: string, authorToken: string): Promise<VoteType | null> {
    const vote = await this.prisma.commentVote.findUnique({
      where: {
        commentId_authorToken: {
          commentId,
          authorToken,
        },
      },
    });

    return vote ? (vote.voteType as VoteType) : null;
  }

  /**
   * 批量获取用户对多个评论的投票状态
   */
  async getUserVotes(commentIds: string[], authorToken: string): Promise<Record<string, VoteType | null>> {
    const votes = await this.prisma.commentVote.findMany({
      where: {
        commentId: { in: commentIds },
        authorToken,
      },
    });

    const voteMap: Record<string, VoteType | null> = {};
    commentIds.forEach(id => {
      voteMap[id] = null;
    });

    votes.forEach(vote => {
      voteMap[vote.commentId] = vote.voteType as VoteType;
    });

    return voteMap;
  }
}