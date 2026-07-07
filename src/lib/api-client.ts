/**
 * Custom API fetch wrapper for client components.
 */

import { getStoredAuthToken } from '@/lib/auth-token';
import type { ApiResponse } from '@/lib/api-response';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const accessToken = getStoredAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  try {
    const json: ApiResponse<T> = await response.json();
    return json;
  } catch {
    return {
      success: false,
      data: null,
      message: `Server Error (${response.status}): ${response.statusText}`,
      errors: null,
      pagination: null,
    };
  }
}
