"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { cleanNameAction } from "@/db/schema";
import { type CleanNameActionInput, cleanNameActionSchema } from "./schema";

export async function getCleanNameActions() {
  try {
    const actions = await db.query.cleanNameAction.findMany({
      orderBy: [desc(cleanNameAction.createdAt)],
    });
    return { success: true, data: actions };
  } catch (error) {
    console.error("Error fetching clean name actions:", error);
    return { success: false, error: "Erro ao buscar ações" };
  }
}

export async function getActiveCleanNameActions() {
  try {
    const actions = await db.query.cleanNameAction.findMany({
      where: eq(cleanNameAction.isActive, true),
      orderBy: [desc(cleanNameAction.createdAt)],
    });
    return { success: true, data: actions };
  } catch (error) {
    console.error("Error fetching active clean name actions:", error);
    return { success: false, error: "Erro ao buscar ações ativas" };
  }
}

export async function getSelectableCleanNameActions() {
  try {
    const actions = await db.query.cleanNameAction.findMany({
      where: and(
        eq(cleanNameAction.isActive, true),
        eq(cleanNameAction.allowSubmissions, true),
      ),
      orderBy: [desc(cleanNameAction.createdAt)],
    });
    return { success: true, data: actions };
  } catch (error) {
    console.error("Error fetching selectable clean name actions:", error);
    return { success: false, error: "Erro ao buscar ações selecionáveis" };
  }
}

export async function createCleanNameAction(data: CleanNameActionInput) {
  try {
    const validated = cleanNameActionSchema.parse(data);

    await db.insert(cleanNameAction).values(validated);

    revalidatePath("/dashboard");
    revalidatePath("/admin/clean-name-actions");
    return { success: true, message: "Ação criada com sucesso" };
  } catch (error) {
    console.error("Error creating clean name action:", error);
    return { success: false, error: "Erro ao criar ação" };
  }
}

export async function updateCleanNameAction(
  id: string,
  data: Partial<CleanNameActionInput>,
) {
  try {
    await db
      .update(cleanNameAction)
      .set(data)
      .where(eq(cleanNameAction.id, id));

    revalidatePath("/dashboard");
    revalidatePath("/admin/clean-name-actions");
    return { success: true, message: "Ação atualizada com sucesso" };
  } catch (error) {
    console.error("Error updating clean name action:", error);
    return { success: false, error: "Erro ao atualizar ação" };
  }
}

export async function deleteCleanNameAction(id: string) {
  try {
    await db.delete(cleanNameAction).where(eq(cleanNameAction.id, id));

    revalidatePath("/dashboard");
    revalidatePath("/admin/clean-name-actions");
    return { success: true, message: "Ação excluída com sucesso" };
  } catch (error) {
    console.error("Error deleting clean name action:", error);
    return { success: false, error: "Erro ao excluir ação" };
  }
}
