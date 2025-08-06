import { FastifyRequest, FastifyReply } from 'fastify';
import { FilterService } from '../services/filter.service';
import { ApiResponse, ListResponse } from '../types/common';
import {
  KeywordFilter,
  FilterStats,
  FilterLog,
  FilterResult,
  CreateKeywordFilterData,
  UpdateKeywordFilterData,
  FilterQuery,
  FilterLogQuery
} from '../types/filter';
import { handleError, createSuccessResponse, NotFoundError } from '../utils/errors';

// 定义接口类型
interface FilterIdParamInput {
  filterId: number;
}

interface FilterListQueryInput extends FilterQuery {
  page?: number;
  limit?: number;
}

interface FilterLogQueryInput extends FilterLogQuery {
  page?: number;
  limit?: number;
}

interface FilterStatsQueryInput {
  siteId?: string;
}

export class FilterController {
  constructor(private filterService: FilterService) {}

  /**
   * 获取关键词过滤器列表
   * GET /api/admin/filters/keywords
   */
  async getFilters(
    request: FastifyRequest<{ Querystring: FilterListQueryInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<ListResponse<KeywordFilter>>> {
    try {
      const query = {
        ...request.query,
        page: request.query.page || 1,
        limit: request.query.limit || 20
      };

      const result = await this.filterService.getFilters(query);

      const response = createSuccessResponse(result);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 获取单个关键词过滤器
   * GET /api/admin/filters/keywords/:filterId
   */
  async getFilterById(
    request: FastifyRequest<{ Params: FilterIdParamInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<KeywordFilter | null>> {
    try {
      const { filterId } = request.params;

      const filter = await this.filterService.getFilterById(filterId);

      if (!filter) {
        throw new NotFoundError('Filter');
      }

      const response = createSuccessResponse(filter);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 创建关键词过滤器
   * POST /api/admin/filters/keywords
   */
  async createFilter(
    request: FastifyRequest<{ Body: CreateKeywordFilterData }>,
    reply: FastifyReply
  ): Promise<ApiResponse<KeywordFilter>> {
    try {
      const filterData = request.body;

      const filter = await this.filterService.createFilter(filterData);

      const response = createSuccessResponse(filter);
      return reply.code(201).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 更新关键词过滤器
   * PUT /api/admin/filters/keywords/:filterId
   */
  async updateFilter(
    request: FastifyRequest<{ Params: FilterIdParamInput; Body: UpdateKeywordFilterData }>,
    reply: FastifyReply
  ): Promise<ApiResponse<KeywordFilter>> {
    try {
      const { filterId } = request.params;
      const updateData = request.body;

      const filter = await this.filterService.updateFilter(filterId, updateData);

      const response = createSuccessResponse(filter);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 删除关键词过滤器
   * DELETE /api/admin/filters/keywords/:filterId
   */
  async deleteFilter(
    request: FastifyRequest<{ Params: FilterIdParamInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const { filterId } = request.params;

      await this.filterService.deleteFilter(filterId);

      const response = createSuccessResponse({
        message: `Filter ${filterId} deleted successfully`
      });
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 获取过滤日志
   * GET /api/admin/filters/logs
   */
  async getFilterLogs(
    request: FastifyRequest<{ Querystring: FilterLogQueryInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<ListResponse<FilterLog>>> {
    try {
      const query = {
        ...request.query,
        page: request.query.page || 1,
        limit: request.query.limit || 20
      };

      const result = await this.filterService.getFilterLogs(query);

      const response = createSuccessResponse(result);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 获取过滤统计
   * GET /api/admin/filters/stats
   */
  async getFilterStats(
    request: FastifyRequest<{ Querystring: FilterStatsQueryInput }>,
    reply: FastifyReply
  ): Promise<ApiResponse<FilterStats>> {
    try {
      const { siteId } = request.query;

      const stats = await this.filterService.getFilterStats(siteId);

      const response = createSuccessResponse(stats);
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 测试内容过滤
   * POST /api/admin/filters/test
   */
  async testFilter(
    request: FastifyRequest<{ Body: { content: string; siteId: string } }>,
    reply: FastifyReply
  ): Promise<ApiResponse<{ originalContent: string; filterResult: FilterResult }>> {
    try {
      const { content, siteId } = request.body;

      const result = await this.filterService.filterContent(content, siteId);

      const response = createSuccessResponse({
        originalContent: content,
        filterResult: result
      });
      return reply.code(200).send(response);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: unknown, reply: FastifyReply): FastifyReply {
    return handleError(error, reply);
  }
}