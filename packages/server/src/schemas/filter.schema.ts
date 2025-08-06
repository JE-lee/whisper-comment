import { Type } from '@sinclair/typebox';

// 枚举类型定义
const MatchType = Type.Union([
  Type.Literal('exact'),
  Type.Literal('fuzzy'),
  Type.Literal('regex')
]);

const FilterAction = Type.Union([
  Type.Literal('replace'),
  Type.Literal('reject'),
  Type.Literal('pending'),
  Type.Literal('warning')
]);

const FilterSeverity = Type.Union([
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high'),
  Type.Literal('critical')
]);

// 基础类型定义
const KeywordFilterBase = Type.Object({
  filterId: Type.Number(),
  siteId: Type.String(),
  keyword: Type.String(),
  matchType: MatchType,
  action: FilterAction,
  severity: FilterSeverity,
  replacement: Type.Optional(Type.String()),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
});

const FilterLogBase = Type.Object({
  logId: Type.Number(),
  commentId: Type.Number(),
  filterId: Type.Number(),
  originalText: Type.String(),
  filteredText: Type.String(),
  action: FilterAction,
  matchedKeyword: Type.String(),
  createdAt: Type.String({ format: 'date-time' })
});

// Request Schemas
export const createKeywordFilterRequestSchema = Type.Object({
  siteId: Type.String({ minLength: 1 }),
  keyword: Type.String({ minLength: 1, maxLength: 255 }),
  matchType: MatchType,
  action: FilterAction,
  severity: FilterSeverity,
  replacement: Type.Optional(Type.String({ maxLength: 500 })),
  isActive: Type.Optional(Type.Boolean())
});

export const updateKeywordFilterRequestSchema = Type.Object({
  keyword: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  matchType: Type.Optional(MatchType),
  action: Type.Optional(FilterAction),
  severity: Type.Optional(FilterSeverity),
  replacement: Type.Optional(Type.String({ maxLength: 500 })),
  isActive: Type.Optional(Type.Boolean())
});

export const filterIdParamSchema = Type.Object({
  filterId: Type.Number({ minimum: 1 })
});

export const filterListQuerySchema = Type.Object({
  siteId: Type.Optional(Type.String()),
  keyword: Type.Optional(Type.String()),
  matchType: Type.Optional(MatchType),
  action: Type.Optional(FilterAction),
  severity: Type.Optional(FilterSeverity),
  isActive: Type.Optional(Type.Boolean()),
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
});

export const filterLogQuerySchema = Type.Object({
  siteId: Type.Optional(Type.String()),
  commentId: Type.Optional(Type.Number()),
  filterId: Type.Optional(Type.Number()),
  action: Type.Optional(FilterAction),
  startDate: Type.Optional(Type.String({ format: 'date-time' })),
  endDate: Type.Optional(Type.String({ format: 'date-time' })),
  page: Type.Optional(Type.Number({ minimum: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
});

export const filterStatsQuerySchema = Type.Object({
  siteId: Type.Optional(Type.String())
});

export const testFilterRequestSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 2000 }),
  siteId: Type.String({ minLength: 1 })
});

// Response Schemas
export const keywordFilterResponseSchema = KeywordFilterBase;

export const keywordFilterListResponseSchema = Type.Object({
  data: Type.Array(KeywordFilterBase),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number()
  })
});

export const filterLogResponseSchema = FilterLogBase;

export const filterLogListResponseSchema = Type.Object({
  data: Type.Array(FilterLogBase),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number()
  })
});

export const filterStatsResponseSchema = Type.Object({
  totalFilters: Type.Number(),
  activeFilters: Type.Number(),
  totalLogs: Type.Number(),
  actionStats: Type.Object({
    replace: Type.Number(),
    reject: Type.Number(),
    pending: Type.Number(),
    warning: Type.Number()
  }),
  severityStats: Type.Object({
    low: Type.Number(),
    medium: Type.Number(),
    high: Type.Number(),
    critical: Type.Number()
  }),
  recentActivity: Type.Array(Type.Object({
    date: Type.String({ format: 'date' }),
    count: Type.Number()
  }))
});

export const testFilterResponseSchema = Type.Object({
  originalContent: Type.String(),
  filterResult: Type.Object({
    filteredContent: Type.String(),
    action: FilterAction,
    matchedFilters: Type.Array(Type.Object({
      filterId: Type.Number(),
      keyword: Type.String(),
      matchType: MatchType,
      action: FilterAction,
      severity: FilterSeverity,
      replacement: Type.Optional(Type.String())
    })),
    hasViolation: Type.Boolean()
  })
});

export const deleteFilterResponseSchema = Type.Object({
  message: Type.String()
});

// API Response Wrapper Schema
const createApiResponseSchema = (dataSchema: any) => Type.Object({
  success: Type.Boolean(),
  data: dataSchema,
  message: Type.Optional(Type.String()),
  timestamp: Type.String({ format: 'date-time' })
});

// Wrapped Response Schemas
export const keywordFilterApiResponseSchema = createApiResponseSchema(keywordFilterResponseSchema);
export const keywordFilterListApiResponseSchema = createApiResponseSchema(keywordFilterListResponseSchema);
export const filterLogApiResponseSchema = createApiResponseSchema(filterLogResponseSchema);
export const filterLogListApiResponseSchema = createApiResponseSchema(filterLogListResponseSchema);
export const filterStatsApiResponseSchema = createApiResponseSchema(filterStatsResponseSchema);
export const testFilterApiResponseSchema = createApiResponseSchema(testFilterResponseSchema);
export const deleteFilterApiResponseSchema = createApiResponseSchema(deleteFilterResponseSchema);