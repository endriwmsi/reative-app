"use server";

import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { commissionEarning, submission, user } from "@/db/schema";

export interface DashboardMetrics {
  totalVendas: number;
  vendasHoje: number;
  parceirosIndicados: number;
  totalFaturamento: number;
  saldoDisponivel: number;
  growthIndicators: {
    totalVendas: number;
    vendasHoje: number;
    parceirosIndicados: number;
    totalFaturamento: number;
    saldoDisponivel: number;
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  const userId = session.user.id;

  try {
    // Buscar dados do usuário atual
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!currentUser.length) {
      throw new Error("Usuário não encontrado");
    }

    const userReferralCode = currentUser[0].referralCode;

    // Data de início do dia atual para vendas hoje
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // 00:00:00.000 do dia atual

    // 1. Total de vendas - total de vendas dos meus indicados (apenas envios pagos)
    const totalVendasResult = await db
      .select({
        total: sum(submission.totalAmount),
      })
      .from(submission)
      .innerJoin(user, eq(submission.userId, user.id))
      .where(
        and(eq(user.referredBy, userReferralCode), eq(submission.isPaid, true)),
      );

    // 2. Vendas hoje - vendas dos meus indicados desde 00:00 de hoje (apenas envios pagos)
    const vendasHojeResult = await db
      .select({
        total: sum(submission.totalAmount),
      })
      .from(submission)
      .innerJoin(user, eq(submission.userId, user.id))
      .where(
        and(
          eq(user.referredBy, userReferralCode),
          eq(submission.isPaid, true),
          gte(submission.createdAt, startOfToday),
        ),
      );

    // 3. Parceiros indicados - pessoas que se cadastraram com meu código
    const parceirosIndicadosResult = await db
      .select({
        count: count(),
      })
      .from(user)
      .where(eq(user.referredBy, userReferralCode));

    // 4. Total de faturamento - soma de todas as vendas pagas feitas pelos meus indicados
    const totalFaturamentoResult = await db
      .select({
        total: sum(submission.totalAmount),
      })
      .from(submission)
      .innerJoin(user, eq(submission.userId, user.id))
      .where(
        and(eq(user.referredBy, userReferralCode), eq(submission.isPaid, true)),
      );

    // 5. Saldo disponível - comissões disponíveis para saque
    const saldoDisponivelResult = await db
      .select({
        total: sum(commissionEarning.commissionAmount),
      })
      .from(commissionEarning)
      .where(
        and(
          eq(commissionEarning.beneficiaryUserId, userId),
          eq(commissionEarning.status, "available"),
        ),
      );

    // Para cálculo de crescimento, vamos comparar com o mês anterior
    const lastMonth = new Date();
    lastMonth.setDate(1); // Primeiro dia do mês atual
    lastMonth.setMonth(lastMonth.getMonth() - 1); // Mês anterior

    const currentMonth = new Date();
    currentMonth.setDate(1); // Primeiro dia do mês atual

    // Vendas do mês anterior para comparação (apenas envios pagos)
    const vendasMesAnteriorResult = await db
      .select({
        total: sum(submission.totalAmount),
      })
      .from(submission)
      .innerJoin(user, eq(submission.userId, user.id))
      .where(
        and(
          eq(user.referredBy, userReferralCode),
          eq(submission.isPaid, true),
          gte(submission.createdAt, lastMonth),
          sql`${submission.createdAt} < ${currentMonth}`,
        ),
      );

    // Parceiros indicados no mês anterior
    const parceirosIndicadosMesAnteriorResult = await db
      .select({
        count: count(),
      })
      .from(user)
      .where(
        and(
          eq(user.referredBy, userReferralCode),
          gte(user.createdAt, lastMonth),
          sql`${user.createdAt} < ${currentMonth}`,
        ),
      );

    // Processar os resultados
    const totalVendas = Number(totalVendasResult[0]?.total || 0);
    const vendasHoje = Number(vendasHojeResult[0]?.total || 0);
    const parceirosIndicados = parceirosIndicadosResult[0]?.count || 0;
    const totalFaturamento = Number(totalFaturamentoResult[0]?.total || 0);
    const saldoDisponivel = Number(saldoDisponivelResult[0]?.total || 0);

    // Calcular indicadores de crescimento
    const vendasMesAnterior = Number(vendasMesAnteriorResult[0]?.total || 0);
    const parceirosIndicadosMesAnterior =
      parceirosIndicadosMesAnteriorResult[0]?.count || 0;

    const calcularCrescimento = (atual: number, anterior: number): number => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return ((atual - anterior) / anterior) * 100;
    };

    return {
      totalVendas,
      vendasHoje,
      parceirosIndicados,
      totalFaturamento,
      saldoDisponivel,
      growthIndicators: {
        totalVendas: calcularCrescimento(totalVendas, vendasMesAnterior),
        vendasHoje: vendasHoje > 0 ? 5.7 : 0, // Valor fixo para vendas diárias
        parceirosIndicados: calcularCrescimento(
          parceirosIndicados,
          parceirosIndicadosMesAnterior,
        ),
        totalFaturamento: calcularCrescimento(totalFaturamento, 0), // Valor acumulativo
        saldoDisponivel: calcularCrescimento(saldoDisponivel, 0), // Valor atual
      },
    };
  } catch (error) {
    console.error("Erro ao buscar métricas do dashboard:", error);
    throw new Error("Falha ao carregar dados do dashboard");
  }
}
