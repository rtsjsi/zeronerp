/**
 * Custom API fetch wrapper for client components.
 * Automatically attaches auth token and handles error responses.
 */

import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { ApiResponse } from "@/lib/api-response";

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

/**
 * Authenticated fetch — automatically attaches the current session token.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const supabase = getSupabaseBrowser();
  let accessToken: string | null = null;

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token ?? null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  try {
    const json: ApiResponse<T> = await response.json();
    return json;
  } catch (err) {
    return {
      success: false,
      data: null,
      message: `Server Error (${response.status}): ${response.statusText}`,
      errors: null,
      pagination: null,
    };
  }
}
