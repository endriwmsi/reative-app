"use server";

import { eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";

export interface ReferralNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  createdAt: Date;
  children: ReferralNode[];
}

export interface ReferralTreeResponse {
  success: boolean;
  data?: ReferralNode[];
  error?: string;
  message?: string;
}

/**
 * Busca a árvore de indicações para um usuário específico
 */
export async function getUserReferralTree(
  userId?: string,
): Promise<ReferralTreeResponse> {
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

    const currentUser = session.user;

    // Se não foi fornecido um userId, usa o usuário atual
    const targetUserId = userId || currentUser.id;

    // Verifica se o usuário atual pode ver a árvore do usuário solicitado
    if (targetUserId !== currentUser.id && currentUser.role !== "admin") {
      return {
        success: false,
        error:
          "Você não tem permissão para ver a árvore de indicações de outros usuários",
      };
    }

    // Busca o usuário alvo para obter seu código de referência
    const targetUserData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (targetUserData.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    const targetUser = targetUserData[0];

    // Busca recursivamente toda a árvore de indicações
    const tree = await buildReferralTree(targetUser.referralCode);

    return {
      success: true,
      data: tree,
      message: "Árvore de indicações carregada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar árvore de indicações:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Busca todas as árvores de indicações (apenas para admins)
 */
export async function getAllReferralTrees(): Promise<ReferralTreeResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return {
        success: false,
        error:
          "Acesso negado. Apenas administradores podem ver todas as árvores",
      };
    }

    // Busca todos os usuários que não foram indicados por ninguém (raízes das árvores)
    const rootUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(isNull(user.referredBy));

    // Constrói a árvore para cada usuário raiz
    const allTrees: ReferralNode[] = [];

    for (const rootUser of rootUsers) {
      const tree = await buildReferralTree(rootUser.referralCode, rootUser);
      if (tree.length > 0) {
        allTrees.push(...tree);
      }
    }

    return {
      success: true,
      data: allTrees,
      message: "Todas as árvores de indicações carregadas com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar todas as árvores de indicações:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

/**
 * Função recursiva para construir a árvore de indicações
 */
async function buildReferralTree(
  referralCode: string,
  rootUser?: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    referredBy: string | null;
    createdAt: Date;
  },
): Promise<ReferralNode[]> {
  // Se rootUser foi fornecido, usa ele como raiz, senão busca o usuário pelo código
  let currentUser = rootUser;

  if (!currentUser) {
    const userData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.referralCode, referralCode))
      .limit(1);

    if (userData.length === 0) {
      return [];
    }

    currentUser = userData[0];
  }

  // Busca todos os usuários que foram indicados por este código
  const referredUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.referredBy, referralCode));

  // Constrói recursivamente os filhos
  const children: ReferralNode[] = [];

  for (const referredUser of referredUsers) {
    const subTree = await buildReferralTree(
      referredUser.referralCode,
      referredUser,
    );
    if (subTree.length > 0) {
      children.push(...subTree);
    }
  }

  // Retorna o nó atual com seus filhos
  const node: ReferralNode = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    referralCode: currentUser.referralCode,
    referredBy: currentUser.referredBy,
    createdAt: currentUser.createdAt,
    children,
  };

  return [node];
}

/**
 * Busca estatísticas da árvore de indicações
 */
export async function getReferralStats(userId?: string) {
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

    const currentUser = session.user;
    const targetUserId = userId || currentUser.id;

    if (targetUserId !== currentUser.id && currentUser.role !== "admin") {
      return {
        success: false,
        error:
          "Você não tem permissão para ver as estatísticas de outros usuários",
      };
    }

    // Busca o código de referência do usuário
    const targetUserData = await db
      .select({
        referralCode: user.referralCode,
      })
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (targetUserData.length === 0) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    const { referralCode } = targetUserData[0];

    // Conta indicações diretas
    const directReferrals = await db
      .select({
        count: user.id,
      })
      .from(user)
      .where(eq(user.referredBy, referralCode));

    // Para contar todas as indicações (incluindo indiretas), precisaríamos fazer uma busca recursiva
    // Por enquanto, vamos contar apenas as diretas
    const totalDirectReferrals = directReferrals.length;

    return {
      success: true,
      data: {
        directReferrals: totalDirectReferrals,
        referralCode,
      },
      message: "Estatísticas carregadas com sucesso",
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de indicações:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
