/**
 * 关键词过滤相关的类型定义
 */

// 匹配类型
export enum MatchType {
  EXACT = 'exact',     // 精确匹配
  FUZZY = 'fuzzy',     // 模糊匹配
  REGEX = 'regex'      // 正则表达式匹配
}

// 过滤动作
export enum FilterAction {
  REJECT = 'reject',     // 拒绝评论
  PENDING = 'pending',   // 标记为待审核
  REPLACE = 'replace',   // 替换敏感词
  WARNING = 'warning'    // 仅记录警告
}

// 严重程度
export enum FilterSeverity {
  SEVERE = 'severe',     // 严重
  MODERATE = 'moderate', // 中等
  MILD = 'mild'          // 轻微
}

// 关键词过滤器
export interface KeywordFilter {
  filterId: number;
  siteId?: string;
  keyword: string;
  matchType: MatchType;
  action: FilterAction;
  severity: FilterSeverity;
  replacement?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 过滤日志
export interface FilterLog {
  logId: number;
  commentId: string;
  filterId: number;
  originalText: string;
  filteredText?: string;
  action: FilterAction;
  matchedKeyword: string;
  createdAt: Date;
}

// 过滤结果
export interface FilterResult {
  isFiltered: boolean;
  action: FilterAction;
  filteredContent?: string;
  matchedFilters: {
    filterId: number;
    keyword: string;
    action: FilterAction;
    replacement?: string;
  }[];
}

// 创建关键词过滤器的数据
export interface CreateKeywordFilterData {
  siteId?: string;
  keyword: string;
  matchType: MatchType;
  action: FilterAction;
  severity: FilterSeverity;
  replacement?: string;
  isActive?: boolean;
}

// 更新关键词过滤器的数据
export interface UpdateKeywordFilterData {
  keyword?: string;
  matchType?: MatchType;
  action?: FilterAction;
  severity?: FilterSeverity;
  replacement?: string;
  isActive?: boolean;
}

// 过滤器查询参数
export interface FilterQuery {
  siteId?: string;
  keyword?: string;
  matchType?: MatchType;
  action?: FilterAction;
  severity?: FilterSeverity;
  isActive?: boolean;
}

// 过滤日志查询参数
export interface FilterLogQuery {
  commentId?: string;
  filterId?: number;
  action?: FilterAction;
  startDate?: Date;
  endDate?: Date;
}

// 过滤统计
export interface FilterStats {
  totalFilters: number;
  activeFilters: number;
  totalLogs: number;
  actionStats: {
    [key in FilterAction]: number;
  };
  severityStats: {
    [key in FilterSeverity]: number;
  };
}