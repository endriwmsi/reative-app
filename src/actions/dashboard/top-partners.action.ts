"use server";

import { and, count, eq, sum } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  commissionEarning,
  submission,
  submissionClient,
  user,
} from "@/db/schema";

export interface TopPartner {
  id: string;
  name: string;
  avatar: string | null;
  totalClients: number; // Total de clientes enviados
  totalCommission: number; // Total de comissões do próprio usuário
  totalSales: number; // Total de vendas (para compatibilidade)
  growth: number; // Percentual de crescimento
}

export async function getTopPartners(
  limit: number = 10,
): Promise<TopPartner[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Buscar todos os usuários que fizeram pelo menos um envio pago
    const usersWithSubmissions = await db
      .select({
        id: user.id,
        name: user.name,
        avatar: user.image,
      })
      .from(user)
      .innerJoin(submission, eq(submission.userId, user.id))
      .where(eq(submission.isPaid, true))
      .groupBy(user.id, user.name, user.image);

    if (usersWithSubmissions.length === 0) {
      return []; // Nenhum usuário com envios encontrado
    }

    // Para cada usuário, calcular suas métricas
    const partnersWithMetrics = await Promise.all(
      usersWithSubmissions.map(async (partner) => {
        // Contar total de clientes enviados por este usuário em envios pagos
        const clientsResult = await db
          .select({
            count: count(submissionClient.id),
          })
          .from(submissionClient)
          .innerJoin(
            submission,
            eq(submission.id, submissionClient.submissionId),
          )
          .where(
            and(eq(submission.userId, partner.id), eq(submission.isPaid, true)),
          );

        // Total de comissões que este usuário recebeu (beneficiaryUserId)
        const commissionResult = await db
          .select({
            total: sum(commissionEarning.commissionAmount),
          })
          .from(commissionEarning)
          .where(eq(commissionEarning.beneficiaryUserId, partner.id));

        // Total de vendas do usuário (para compatibilidade) - apenas envios pagos
        const salesResult = await db
          .select({
            total: sum(submission.totalAmount),
          })
          .from(submission)
          .where(
            and(eq(submission.userId, partner.id), eq(submission.isPaid, true)),
          );

        const totalClients = clientsResult[0]?.count || 0;
        const totalCommission = Number(commissionResult[0]?.total || 0);
        const totalSales = Number(salesResult[0]?.total || 0);

        return {
          id: partner.id,
          name: partner.name || "Usuário",
          avatar: partner.avatar,
          totalClients,
          totalCommission,
          totalSales,
          growth: 0, // Por simplicidade, vamos deixar 0 por enquanto
        };
      }),
    );

    // Filtrar e ordenar por quantidade de clientes
    return partnersWithMetrics
      .filter((partner) => partner.totalClients > 0)
      .sort((a, b) => b.totalClients - a.totalClients)
      .slice(0, limit);
  } catch (error) {
    console.error("Erro ao buscar top parceiros:", error);
    throw new Error("Falha ao carregar ranking de parceiros");
  }
}
