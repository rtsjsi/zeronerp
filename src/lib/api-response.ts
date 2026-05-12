/**
 * API Response Wrapper
 * 
 * Standardised JSON response shape for every API route.
 * Every endpoint returns { success, data, message, errors, pagination }.
 */

import { NextResponse } from 'next/server';

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors: Record<string, string[]> | null;
  pagination: PaginationMeta | null;
}

/**
 * Build a successful JSON response.
 * @param data       — payload
 * @param message    — human-readable message
 * @param status     — HTTP status code (default 200)
 * @param pagination — optional pagination metadata
 */
export function apiSuccess<T>(
  data: T,
  message = 'Success',
  status = 200,
  pagination?: PaginationMeta,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      errors: null,
      pagination: pagination ?? null,
    },
    { status },
  );
}

/**
 * Build an error JSON response.
 * @param message — human-readable error message
 * @param status  — HTTP status code (default 400)
 * @param errors  — field-level validation errors
 */
export function apiError(
  message = 'Something went wrong',
  status = 400,
  errors?: Record<string, string[]>,
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
      errors: errors ?? null,
      pagination: null,
    },
    { status },
  );
}

/**
 * Compute pagination metadata from page, limit, and total count.
 */
export function buildPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
