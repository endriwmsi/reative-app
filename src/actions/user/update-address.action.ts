"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";

type UpdateAddressParams = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  uf: string;
  cep: string;
};

export async function updateAddressAction(data: UpdateAddressParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/login");

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

    revalidatePath("/configuracoes");

    return {
      success: true,
      message: "Endereço atualizado com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);
    return {
      success: false,
      error: "Erro ao atualizar endereço. Tente novamente.",
    };
  }
}
