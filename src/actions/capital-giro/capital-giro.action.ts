"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { SolicitacaoFormValues } from "@/app/(app)/(dashboard)/solicitacoes-capital-giro/_components/solicitacao-form";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { capitalGiro, user } from "@/db/schema";
import { generateCapitalGiroKey, getS3Url, uploadToS3 } from "@/lib/s3-client";

interface CreateCapitalGiroData
  extends Omit<SolicitacaoFormValues, "documento"> {
  documento?: File;
}

export async function markCapitalGiroAsDownloaded(ids: string[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!currentUser?.isAdmin) {
      return { success: false, error: "Permissão negada" };
    }

    await db
      .update(capitalGiro)
      .set({
        isDownloaded: true,
        downloadedAt: new Date(),
      })
      .where(inArray(capitalGiro.id, ids));

    revalidatePath("/solicitacoes-capital-giro");
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como baixado:", error);
    return { success: false, error: "Erro ao marcar como baixado" };
  }
}

export async function createCapitalGiro(data: CreateCapitalGiroData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    let documentoUrl: string | null = null;

    // Validação: documento é obrigatório
    if (!data.documento) {
      return {
        success: false,
        error: "Upload do termo de autorização é obrigatório",
      };
    }

    // Upload do documento
    try {
      const arrayBuffer = await data.documento.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const key = generateCapitalGiroKey(session.user.id, data.documento.name);

      await uploadToS3(buffer, key, data.documento.type);
      documentoUrl = getS3Url(key);
    } catch (uploadError) {
      console.error("Erro no upload do documento:", uploadError);
      return {
        success: false,
        error: "Erro ao fazer upload do documento",
      };
    }

    const { documento, ...formData } = data;

    await db.insert(capitalGiro).values({
      id: nanoid(),
      userId: session.user.id,
      ...formData,
      documentoUrl,
      status: "pending",
    });

    revalidatePath("/solicitacoes-capital-giro");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
    return { success: false, error: "Erro ao criar solicitação" };
  }
}

export async function deleteCapitalGiro(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!currentUser?.isAdmin) {
      return { success: false, error: "Permissão negada" };
    }

    await db.delete(capitalGiro).where(eq(capitalGiro.id, id));

    revalidatePath("/solicitacoes-capital-giro");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar solicitação:", error);
    return { success: false, error: "Erro ao deletar solicitação" };
  }
}

export async function updateCapitalGiroStatus(
  id: string,
  status: "pending" | "analyzing" | "approved" | "rejected",
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!currentUser?.isAdmin) {
      return { success: false, error: "Permissão negada" };
    }

    await db.update(capitalGiro).set({ status }).where(eq(capitalGiro.id, id));

    revalidatePath("/solicitacoes-capital-giro");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, error: "Erro ao atualizar status" };
  }
}

export async function getCapitalGiroSolicitations() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const [currentUser] = await db
      .select({ isAdmin: user.isAdmin, role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));

    let solicitations = [];

    if (currentUser?.role === "admin") {
      solicitations = await db
        .select()
        .from(capitalGiro)
        .orderBy(desc(capitalGiro.createdAt));
    } else {
      solicitations = await db
        .select()
        .from(capitalGiro)
        .where(eq(capitalGiro.userId, session.user.id))
        .orderBy(desc(capitalGiro.createdAt));
    }

    return { success: true, data: solicitations };
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    return { success: false, error: "Erro ao buscar solicitações" };
  }
}
