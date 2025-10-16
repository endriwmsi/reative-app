"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema/user";
import { generateAvatarKey, getS3Url, uploadToS3 } from "@/lib/s3-client";

type UploadAvatarResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadAvatarAction(
  formData: FormData,
): Promise<UploadAvatarResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return { success: false, error: "Arquivo inválido" };
    }

    // Validations: size and mime type
    const MAX_MB = 2;
    const MAX_BYTES = MAX_MB * 1024 * 1024 * 2;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    const fileType =
      "type" in file &&
      typeof (file as Blob & { type?: string }).type === "string"
        ? (file as Blob & { type?: string }).type
        : "";

    if (!allowedTypes.has(fileType)) {
      return {
        success: false,
        error: "Formato inválido. Use JPEG, PNG ou WEBP.",
      };
    }

    if (file.size > MAX_BYTES) {
      return {
        success: false,
        error: `A imagem deve ter no máximo ${MAX_MB}MB.`,
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType =
      "type" in file &&
      typeof (file as Blob & { type?: string }).type === "string" &&
      file.type
        ? file.type
        : "image/jpeg";
    const possibleName =
      "name" in file &&
      typeof (file as Blob & { name?: string }).name === "string"
        ? (file as Blob & { name?: string }).name
        : undefined;
    const fileName =
      possibleName && possibleName.length > 0 ? possibleName : "avatar.jpg";
    const key = generateAvatarKey(session.user.id, fileName);

    await uploadToS3(buffer, key, contentType);
    const publicUrl = getS3Url(key);

    await db
      .update(user)
      .set({ image: publicUrl, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    revalidatePath("/configuracoes");

    await auth.api.getSession({ headers: await headers() });

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Erro no upload do avatar:", error);
    return { success: false, error: "Falha ao fazer upload da imagem" };
  }
}
