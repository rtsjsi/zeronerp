/**
 * OCR Service — Stub implementation (Tesseract removed to reduce bundle size)
 * 
 * Provides document scanning capabilities. Currently disabled to optimize
 * bundle size for Cloudflare Free plan.
 */

export interface OcrResult {
  success: boolean;
  text: string;
  confidence: number;
  error?: string;
}

/**
 * Extract text from an image file or URL.
 * (STUB: Currently disabled to reduce bundle size)
 */
export async function extractTextFromImage(
  image: File | Blob | string,
  lang = 'eng',
): Promise<OcrResult> {
  console.warn('[OCR] Service is currently disabled to optimize bundle size.');
  return {
    success: false,
    text: '',
    confidence: 0,
    error: 'OCR service is currently disabled to meet deployment size limits.',
  };
}

/**
 * Extract text from multiple images and concatenate results.
 * (STUB: Currently disabled to reduce bundle size)
 */
export async function extractTextFromMultipleImages(
  images: Array<File | Blob | string>,
  lang = 'eng',
): Promise<OcrResult> {
  return {
    success: false,
    text: '',
    confidence: 0,
    error: 'OCR service is currently disabled to meet deployment size limits.',
  };
}
