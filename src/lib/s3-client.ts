import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Configuração do cliente S3
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET =
  process.env.S3_BUCKET_NAME || "reative-platform-uploads";

// Função para fazer upload de arquivo para S3
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

// Função para gerar chave única para o arquivo
export function generateS3Key(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `listas/${userId}/${timestamp}_${sanitizedFileName}`;
}

// Função específica para avatars
export function generateAvatarKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `avatars/${userId}/${timestamp}_${sanitizedFileName}`;
}

// Função para obter URL temporária do arquivo (opcional, para download)
export function getS3Url(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "sa-east-1"}.amazonaws.com/${key}`;
}
