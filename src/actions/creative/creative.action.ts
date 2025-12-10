"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { creatives } from "@/db/schema/creatives";
import {
  deleteFromS3,
  generateCreativeKey,
  getS3Url,
  uploadToS3,
} from "@/lib/s3-client";
import { desc, eq } from "drizzle-orm";

type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }
  // Using role based validation as requested
  if (session.user.role !== "admin") {
    throw new Error("Acesso negado: Apenas administradores podem realizar esta ação");
  }
  return session;
}

export async function uploadCreativeAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await checkAdmin();

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || !title) {
      return { success: false, error: "Arquivo e título são obrigatórios" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = generateCreativeKey(file.name);
    
    await uploadToS3(buffer, key, file.type);
    const url = getS3Url(key);

    await db.insert(creatives).values({
      title,
      key,
      url,
    });

    revalidatePath("/criativos");
    return { success: true, message: "Criativo enviado com sucesso" };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message || "Erro ao fazer upload" };
  }
}

export async function deleteCreativeAction(id: string, key: string): Promise<ActionResult> {
  try {
    await checkAdmin();

    await deleteFromS3(key);
    await db.delete(creatives).where(eq(creatives.id, id));

    revalidatePath("/criativos");
    return { success: true, message: "Criativo excluído com sucesso" };
  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message || "Erro ao excluir criativo" };
  }
}

export async function getCreativesAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  
  // Everyone (authenticated) can see creatives, admins can edit.
  // We handle permission checks for UI in the components.
  
  return await db.query.creatives.findMany({
    orderBy: [desc(creatives.createdAt)],
  });
}
