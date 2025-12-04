"use server";

import { aliasedTable, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { user } from "@/db/schema";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  cpf: string | null;
  cnpj: string | null;
  isAdmin: boolean;
  createdAt: Date;
  referredByEmail?: string | null;
}

/**
 * Verifica se um usuário é administrador
 */
export async function isUserAdmin(userId: string): Promise<{
  success: boolean;
  isAdmin?: boolean;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    const userData = await db
      .select({
        isAdmin: user.isAdmin,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    return {
      success: true,
      isAdmin: userData[0].isAdmin,
    };
  } catch (error) {
    console.error("Erro ao verificar admin:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Busca todos os usuários do sistema (apenas para admins)
 */
export async function getAllUsers(): Promise<{
  success: boolean;
  data?: User[];
  error?: string;
}> {
  try {
    const referrer = aliasedTable(user, "referrer");

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        phone: user.phone,
        cpf: user.cpf,
        cnpj: user.cnpj,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        referredByEmail: referrer.email,
      })
      .from(user)
      .leftJoin(referrer, eq(user.referredBy, referrer.referralCode))
      .orderBy(desc(user.createdAt));

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Aprova uma conta de usuário (marca email como verificado)
 */
export async function approveUserAccount(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    // Verifica se o usuário existe
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Atualiza o campo email_verified para true
    await db
      .update(user)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Revalida a página para refletir as mudanças
    revalidatePath("/usuarios");

    return {
      success: true,
      message: "Conta aprovada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao aprovar conta:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Rejeita uma conta de usuário (marca email como não verificado)
 */
export async function rejectUserAccount(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    // Verifica se o usuário existe
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Atualiza o campo email_verified para false
    await db
      .update(user)
      .set({
        emailVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Revalida a página para refletir as mudanças
    revalidatePath("/usuarios");

    return {
      success: true,
      message: "Conta rejeitada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao rejeitar conta:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
