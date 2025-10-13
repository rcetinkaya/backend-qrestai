/**
 * Pagination utilities
 */

import { PaginatedResponse, PaginationParams } from '../types/api.js';

export class PaginationUtils {
  /**
   * Calculate pagination metadata
   */
  static calculatePagination(
    total: number,
    page: number = 1,
    limit: number = 10
  ): PaginatedResponse<never>['pagination'] {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Get skip and take values for Prisma
   */
  static getPaginationParams(params: PaginationParams): { skip: number; take: number } {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));

    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  /**
   * Format paginated response
   */
  static formatResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    return {
      data,
      pagination: this.calculatePagination(total, page, limit),
    };
  }
}
