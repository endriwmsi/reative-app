"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";

type UpdateDocumentsParams = {
  cpf?: string;
  cnpj?: string;
};

export async function updateDocumentsAction(_data: UpdateDocumentsParams) {
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

    // Documentos não podem ser alterados após o registro
    return {
      success: false,
      error: "Os documentos não podem ser alterados após o registro",
    };
  } catch (error) {
    console.error("Erro ao atualizar documentos:", error);
    return {
      success: false,
      error: "Erro ao atualizar documentos. Tente novamente.",
    };
  }
}
