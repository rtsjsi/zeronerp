/**
 * OCR Service — Tesseract.js wrapper
 * 
 * Provides document scanning capabilities using Tesseract.js.
 * Runs in-browser for client-side OCR or server-side in Node.
 * 
 * Usage:
 *   const text = await extractTextFromImage(imageFile);
 *   const parsed = await aiParseDocument(text, 'invoice', [...]);
 */

import Tesseract from 'tesseract.js';

export interface OcrResult {
  success: boolean;
  text: string;
  confidence: number;
  error?: string;
}

/**
 * Extract text from an image file or URL using Tesseract.js OCR.
 * 
 * @param image — File, Blob, URL string, or base64 data URI
 * @param lang  — OCR language(s), default 'eng' (English)
 *                Use 'eng+hin' for English + Hindi
 */
export async function extractTextFromImage(
  image: File | Blob | string,
  lang = 'eng',
): Promise<OcrResult> {
  try {
    const result = await Tesseract.recognize(image, lang, {
      logger: (info) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[OCR]', info.status, `${Math.round((info.progress || 0) * 100)}%`);
        }
      },
    });

    return {
      success: true,
      text: result.data.text.trim(),
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('[OCR Service Error]', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'OCR processing failed',
    };
  }
}

/**
 * Extract text from multiple images and concatenate results.
 * Useful for multi-page documents.
 */
export async function extractTextFromMultipleImages(
  images: Array<File | Blob | string>,
  lang = 'eng',
): Promise<OcrResult> {
  try {
    const results = await Promise.all(
      images.map((img) => extractTextFromImage(img, lang)),
    );

    const allText = results
      .filter((r) => r.success)
      .map((r) => r.text)
      .join('\n\n--- Page Break ---\n\n');

    const avgConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      success: true,
      text: allText,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('[OCR Service Error]', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Multi-page OCR failed',
    };
  }
}
