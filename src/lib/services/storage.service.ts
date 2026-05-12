/**
 * Cloudflare R2 File Storage Service
 * 
 * Uses the AWS S3 SDK pointed at the R2 endpoint.
 * Handles file uploads, downloads, deletions, and presigned URLs.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// ─── Client ─────────────────────────────────────────

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 environment variables');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2Client;
}

// ─── Types ──────────────────────────────────────────

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  error?: string;
}

// ─── Methods ────────────────────────────────────────

/**
 * Upload a file to R2.
 * 
 * @param file      — the file buffer
 * @param fileName  — original file name
 * @param tenantId  — tenant ID for path isolation
 * @param folder    — optional subfolder (e.g. 'invoices', 'receipts')
 * @param mimeType  — file MIME type
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  tenantId: string,
  folder = 'general',
  mimeType = 'application/octet-stream',
): Promise<UploadResult> {
  try {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicUrl = process.env.R2_PUBLIC_URL!;

    // Build a unique, tenant-isolated key
    const ext = fileName.split('.').pop() || 'bin';
    const uniqueId = randomUUID();
    const key = `${tenantId}/${folder}/${uniqueId}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
      }),
    );

    return {
      success: true,
      key,
      url: `${publicUrl}/${key}`,
    };
  } catch (error) {
    console.error('[R2 Upload Error]', error);
    return {
      success: false,
      key: '',
      url: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Download a file from R2 as a readable stream.
 */
export async function downloadFile(key: string): Promise<ReadableStream | null> {
  try {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;

    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return response.Body?.transformToWebStream() ?? null;
  } catch (error) {
    console.error('[R2 Download Error]', error);
    return null;
  }
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return true;
  } catch (error) {
    console.error('[R2 Delete Error]', error);
    return false;
  }
}
