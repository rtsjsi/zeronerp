/**
 * Storage Service — Stub implementation (AWS SDK removed to reduce bundle size)
 * 
 * Provides file storage capabilities. Currently disabled to optimize
 * bundle size for Cloudflare Free plan.
 */

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  error?: string;
}

/**
 * Upload a file to R2.
 * (STUB: Currently disabled to reduce bundle size)
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  tenantId: string,
  folder = 'general',
  mimeType = 'application/octet-stream',
): Promise<UploadResult> {
  console.warn('[Storage] Service is currently disabled to optimize bundle size.');
  return {
    success: false,
    key: '',
    url: '',
    error: 'Storage service is currently disabled to meet deployment size limits.',
  };
}

/**
 * Download a file from R2.
 * (STUB: Currently disabled to reduce bundle size)
 */
export async function downloadFile(key: string): Promise<ReadableStream | null> {
  return null;
}

/**
 * Delete a file from R2.
 * (STUB: Currently disabled to reduce bundle size)
 */
export async function deleteFile(key: string): Promise<boolean> {
  return false;
}
