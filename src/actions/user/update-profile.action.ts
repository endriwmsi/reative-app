"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";

type UpdateProfileParams = {
  name?: string;
  phone?: string;
  image?: string;
};

export async function updateProfileAction(data: UpdateProfileParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    revalidatePath("/(dashboard)/**");

    return {
      success: true,
      message: "Perfil atualizado com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return {
      success: false,
      error: "Erro ao atualizar perfil. Tente novamente.",
    };
  }
}
