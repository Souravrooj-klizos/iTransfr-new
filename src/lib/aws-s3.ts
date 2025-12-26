// AWS S3 Configuration and Utility for KYC Document Storage
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
    ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const KYC_BUCKET = process.env.AWS_S3_KYC_BUCKET || 'itransfr-kyc-documents';

/**
 * Upload KYC document to S3
 * @param file - File buffer to upload
 * @param userId - User ID (for organizing files)
 * @param documentType - Type of document (passport, address_proof, photo_id)
 * @param fileName - Original file name
 * @returns Object with S3 key and public URL
 */
export async function uploadKYCDocument(
  file: Buffer,
  userId: string,
  documentType: 'passport' | 'address_proof' | 'photo_id',
  fileName: string,
  mimeType: string
): Promise<{ s3Key: string; fileUrl: string; bucket: string }> {
  try {
    // Create organized folder structure: userId/documentType/filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `kyc/${userId}/${documentType}/${timestamp}-${sanitizedFileName}`;

    const uploadParams = {
      Bucket: KYC_BUCKET,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      ServerSideEncryption: ServerSideEncryption.AES256, // Encryption at rest
      Metadata: {
        userId,
        documentType,
        uploadedAt: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate public URL (you can also use CloudFront if needed)
    const fileUrl = `https://${KYC_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${s3Key}`;

    return {
      s3Key,
      fileUrl,
      bucket: KYC_BUCKET,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload document to S3');
  }
}

/**
 * Generate a presigned URL for secure document access
 * @param s3Key - S3 object key
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: KYC_BUCKET,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

/**
 * Delete KYC document from S3
 * @param s3Key - S3 object key to delete
 */
export async function deleteKYCDocument(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: KYC_BUCKET,
      Key: s3Key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete document from S3');
  }
}

/**
 * Helper: Convert File to Buffer
 * Use this in API routes to convert uploaded files
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Validate file type for KYC documents
 */
export function validateKYCFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSizeInMB = 10;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.',
    };
  }

  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit.`,
    };
  }

  return { valid: true };
}

/**
 * Download document from S3
 * @param s3Key - S3 object key
 * @returns Buffer of file content
 */
export async function downloadDocument(s3Key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: KYC_BUCKET,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading from S3:', error);
    throw new Error('Failed to download document from S3');
  }
}

