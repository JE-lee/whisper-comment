import { PrismaClient } from '@prisma/client';
import {
  KeywordFilter,
  FilterLog,
  FilterResult,
  CreateKeywordFilterData,
  UpdateKeywordFilterData,
  FilterQuery,
  FilterLogQuery,
  FilterStats,
  MatchType,
  FilterAction,
  FilterSeverity
} from '../types/filter';
import { PaginationParams, PaginationInfo } from '../types/common';

/**
 * 关键词过滤服务
 */
export class FilterService {
  constructor(private prisma: PrismaClient) {}
  /**
   * 过滤评论内容
   */
  async filterContent(content: string, siteId: string): Promise<FilterResult> {
    // 获取适用的过滤器（全局 + 站点特定）
    const filters = await this.getApplicableFilters(siteId);
    
    const matchedFilters: FilterResult['matchedFilters'] = [];
    let filteredContent = content;
    let finalAction = FilterAction.WARNING;
    
    // 遍历所有过滤器进行匹配
    for (const filter of filters) {
      const matchResult = this.matchKeyword(content, filter.keyword, filter.matchType as MatchType);
      
      if (matchResult.isMatch) {
        matchedFilters.push({
          filterId: filter.filterId,
          keyword: filter.keyword,
          action: filter.action as FilterAction,
          replacement: filter.replacement || undefined
        });
        
        // 根据动作处理内容
        if (filter.action === FilterAction.REPLACE && filter.replacement) {
          filteredContent = this.replaceKeyword(
            filteredContent,
            filter.keyword,
            filter.replacement,
            filter.matchType as MatchType
          );
        }
        
        // 确定最终动作（优先级：REJECT > PENDING > REPLACE > WARNING）
        if (filter.action === FilterAction.REJECT) {
          finalAction = FilterAction.REJECT;
        } else if (filter.action === FilterAction.PENDING && finalAction !== FilterAction.REJECT) {
          finalAction = FilterAction.PENDING;
        } else if (filter.action === FilterAction.REPLACE && finalAction === FilterAction.WARNING) {
          finalAction = FilterAction.REPLACE;
        }
      }
    }
    
    return {
      isFiltered: matchedFilters.length > 0,
      action: finalAction,
      filteredContent: filteredContent !== content ? filteredContent : undefined,
      matchedFilters
    };
  }
  
  /**
   * 记录过滤日志
   */
  async logFilter(
    commentId: string,
    filterId: number,
    originalText: string,
    filteredText: string | undefined,
    action: FilterAction,
    matchedKeyword: string
  ): Promise<FilterLog> {
    const log = await this.prisma.filterLog.create({
      data: {
        commentId,
        filterId,
        originalText,
        filteredText,
        action,
        matchedKeyword
      }
    });
    
    return log as FilterLog;
  }
  
  /**
   * 创建关键词过滤器
   */
  async createFilter(data: CreateKeywordFilterData): Promise<KeywordFilter> {
    const filter = await this.prisma.keywordFilter.create({
      data: {
        siteId: data.siteId,
        keyword: data.keyword,
        matchType: data.matchType,
        action: data.action,
        severity: data.severity,
        replacement: data.replacement,
        isActive: data.isActive ?? true
      }
    });
    
    return filter as KeywordFilter;
  }
  
  /**
   * 获取关键词过滤器列表
   */
  async getFilters(
    query: FilterQuery & PaginationParams
  ): Promise<{ filters: KeywordFilter[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 20, ...filterQuery } = query;
    const skip = (page - 1) * limit;
    
    const where: Record<string, unknown> = {};
    
    if (filterQuery.siteId !== undefined) {
      where.siteId = filterQuery.siteId;
    }
    if (filterQuery.keyword) {
      where.keyword = { contains: filterQuery.keyword, mode: 'insensitive' };
    }
    if (filterQuery.matchType) {
      where.matchType = filterQuery.matchType;
    }
    if (filterQuery.action) {
      where.action = filterQuery.action;
    }
    if (filterQuery.severity) {
      where.severity = filterQuery.severity;
    }
    if (filterQuery.isActive !== undefined) {
      where.isActive = filterQuery.isActive;
    }
    
    const [filters, total] = await Promise.all([
      this.prisma.keywordFilter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.keywordFilter.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      filters: filters as KeywordFilter[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
  
  /**
   * 获取单个关键词过滤器
   */
  async getFilterById(filterId: number): Promise<KeywordFilter | null> {
    const filter = await this.prisma.keywordFilter.findUnique({
      where: { filterId }
    });
    
    return filter as KeywordFilter | null;
  }
  
  /**
   * 更新关键词过滤器
   */
  async updateFilter(filterId: number, data: UpdateKeywordFilterData): Promise<KeywordFilter> {
    const filter = await this.prisma.keywordFilter.update({
      where: { filterId },
      data
    });
    
    return filter as KeywordFilter;
  }
  
  /**
   * 删除关键词过滤器
   */
  async deleteFilter(filterId: number): Promise<void> {
    await this.prisma.keywordFilter.delete({
      where: { filterId }
    });
  }
  
  /**
   * 获取过滤日志
   */
  async getFilterLogs(
    query: FilterLogQuery & PaginationParams
  ): Promise<{ logs: FilterLog[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 20, ...logQuery } = query;
    const skip = (page - 1) * limit;
    
    const where: Record<string, unknown> = {};
    
    if (logQuery.commentId) {
      where.commentId = logQuery.commentId;
    }
    if (logQuery.filterId) {
      where.filterId = logQuery.filterId;
    }
    if (logQuery.action) {
      where.action = logQuery.action;
    }
    if (logQuery.startDate || logQuery.endDate) {
      where.createdAt = {};
      if (logQuery.startDate) {
        (where.createdAt as any).gte = logQuery.startDate;
      }
      if (logQuery.endDate) {
        (where.createdAt as any).lte = logQuery.endDate;
      }
    }
    
    const [logs, total] = await Promise.all([
      this.prisma.filterLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          filter: true,
          comment: {
            select: {
              authorNickname: true,
              pageIdentifier: true
            }
          }
        }
      }),
      this.prisma.filterLog.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      logs: logs as FilterLog[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
  
  /**
   * 获取过滤统计
   */
  async getFilterStats(siteId?: string): Promise<FilterStats> {
    const filterWhere = siteId ? { siteId } : {};
    const logWhere = siteId ? {
      filter: { siteId }
    } : {};
    
    const [totalFilters, activeFilters, totalLogs, actionStats, severityStats] = await Promise.all([
      this.prisma.keywordFilter.count({ where: filterWhere }),
      this.prisma.keywordFilter.count({ where: { ...filterWhere, isActive: true } }),
      this.prisma.filterLog.count({ where: logWhere }),
      this.getActionStats(siteId),
      this.getSeverityStats(siteId)
    ]);
    
    return {
      totalFilters,
      activeFilters,
      totalLogs,
      actionStats,
      severityStats
    };
  }
  
  /**
   * 获取适用的过滤器（全局 + 站点特定）
   */
  private async getApplicableFilters(siteId: string): Promise<KeywordFilter[]> {
    const filters = await this.prisma.keywordFilter.findMany({
      where: {
        isActive: true,
        OR: [
          { siteId: null }, // 全局过滤器
          { siteId }        // 站点特定过滤器
        ]
      },
      orderBy: [
        { severity: 'desc' }, // 严重程度优先
        { createdAt: 'asc' }  // 创建时间
      ]
    });
    return filters as KeywordFilter[];
  }
  
  /**
   * 匹配关键词
   */
  private matchKeyword(content: string, keyword: string, matchType: MatchType): { isMatch: boolean; matches: string[] } {
    const matches: string[] = [];
    let isMatch = false;
    
    switch (matchType) {
      case MatchType.EXACT:
        isMatch = content.toLowerCase().includes(keyword.toLowerCase());
        if (isMatch) matches.push(keyword);
        break;
        
      case MatchType.FUZZY: {
        // 简单的模糊匹配：忽略空格和特殊字符
        const normalizedContent = content.replace(/[\s\W]/g, '').toLowerCase();
        const normalizedKeyword = keyword.replace(/[\s\W]/g, '').toLowerCase();
        isMatch = normalizedContent.includes(normalizedKeyword);
        if (isMatch) matches.push(keyword);
        break;
      }
        
      case MatchType.REGEX: {
        try {
          const regex = new RegExp(keyword, 'gi');
          const regexMatches = content.match(regex);
          if (regexMatches) {
            isMatch = true;
            matches.push(...regexMatches);
          }
        } catch {
          // 正则表达式无效，跳过
          console.warn(`Invalid regex pattern: ${keyword}`);
        }
        break;
      }
    }
    
    return { isMatch, matches };
  }
  
  /**
   * 替换关键词
   */
  private replaceKeyword(content: string, keyword: string, replacement: string, matchType: MatchType): string {
    switch (matchType) {
      case MatchType.EXACT:
        return content.replace(new RegExp(keyword, 'gi'), replacement);
        
      case MatchType.FUZZY:
        // 对于模糊匹配，使用简单的替换策略
        return content.replace(new RegExp(keyword, 'gi'), replacement);
        
      case MatchType.REGEX:
        try {
          return content.replace(new RegExp(keyword, 'gi'), replacement);
        } catch {
          console.warn(`Invalid regex pattern for replacement: ${keyword}`);
          return content;
        }
        
      default:
        return content;
    }
  }
  
  /**
   * 获取动作统计
   */
  private async getActionStats(siteId?: string): Promise<{ [key in FilterAction]: number }> {
    const where = siteId ? { filter: { siteId } } : {};
    
    const stats = await this.prisma.filterLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true }
    });
    
    const result = {
      [FilterAction.REJECT]: 0,
      [FilterAction.PENDING]: 0,
      [FilterAction.REPLACE]: 0,
      [FilterAction.WARNING]: 0
    };
    
    stats.forEach(stat => {
      result[stat.action as FilterAction] = stat._count.action;
    });
    
    return result;
  }
  
  /**
   * 获取严重程度统计
   */
  private async getSeverityStats(siteId?: string): Promise<{ [key in FilterSeverity]: number }> {
    const where = siteId ? { siteId } : {};
    
    const stats = await this.prisma.keywordFilter.groupBy({
      by: ['severity'],
      where: { ...where, isActive: true },
      _count: { severity: true }
    });
    
    const result = {
      [FilterSeverity.SEVERE]: 0,
      [FilterSeverity.MODERATE]: 0,
      [FilterSeverity.MILD]: 0
    };
    
    // 映射数据库中的值到枚举
    const severityMapping: { [key: string]: FilterSeverity } = {
      'critical': FilterSeverity.SEVERE,
      'high': FilterSeverity.SEVERE,
      'medium': FilterSeverity.MODERATE,
      'low': FilterSeverity.MILD
    };
    
    stats.forEach(stat => {
      const mappedSeverity = severityMapping[stat.severity] || FilterSeverity.MILD;
      result[mappedSeverity] = stat._count.severity;
    });
    
    return result;
  }
}