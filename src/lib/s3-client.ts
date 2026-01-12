import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// S3 Client Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET =
  process.env.S3_BUCKET_NAME || "reative-platform-uploads";

/**
 * Uploads a file to S3.
 * @param file The file buffer.
 * @param key The S3 object key.
 * @param contentType The MIME type of the file.
 * @returns The key of the uploaded file.
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string = "application/octet-stream",
): Promise<string> {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
      },
    });

    await upload.done();
    return key;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Deletes a file from S3.
 * @param key The S3 object key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
}

/**
 * Generates a unique S3 key for a file.
 */
export function generateS3Key(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${prefix}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Generates a unique S3 key for avatars.
 */
export function generateAvatarKey(userId: string, fileName: string): string {
  return generateS3Key(`avatars/${userId}`, fileName);
}

/**
 * Generates a unique S3 key for creatives.
 */
export function generateCreativeKey(fileName: string): string {
  return generateS3Key("creatives", fileName);
}

/**
 * Generates a unique S3 key for capital giro documents.
 */
export function generateCapitalGiroKey(
  userId: string,
  fileName: string,
): string {
  return generateS3Key(`capital-giro/${userId}`, fileName);
}

/**
 * Returns the public URL for an S3 object.
 */
export function getS3Url(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "sa-east-1"}.amazonaws.com/${key}`;
}
