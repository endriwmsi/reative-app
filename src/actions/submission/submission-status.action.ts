"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  STATUS_GROUPS,
  SUBMISSION_STATUS,
  type SubmissionStatus,
} from "@/constants/submission-status";
import { db } from "@/db/client";
import { submission, submissionClient } from "@/db/schema";

/**
 * LÓGICA DO STATUS DA SUBMISSION:
 *
 * O status da submission reflete o status individual de cada cliente:
 *
 * ✅ APROVADO (concluido): Todos os clientes estão aprovados/deferidos
 * ❌ REJEITADO (rejeitado): Todos os clientes estão rejeitados/indeferidos/cancelados
 * ⚠️ PARCIALMENTE APROVADO (parcialmente_concluido): Alguns clientes aprovados, outros pendentes/processando
 * ⚠️ PARCIALMENTE REJEITADO (parcialmente_rejeitado): Alguns clientes rejeitados, outros em diferentes status
 * 🔄 PROCESSANDO/EM ANÁLISE: Clientes sendo processados ou em análise jurídica
 * ⏳ AGUARDANDO: Todos os clientes ainda pendentes
 * ✔️ FINALIZADO: Todos os clientes finalizados (processo concluído)
 */

export async function calculateSubmissionStatus(
  submissionId: string,
): Promise<SubmissionStatus> {
  const clientsStatus = await db
    .select({
      status: submissionClient.status,
    })
    .from(submissionClient)
    .where(eq(submissionClient.submissionId, submissionId));

  if (clientsStatus.length === 0) {
    return SUBMISSION_STATUS.AGUARDANDO;
  }

  const statusCounts = clientsStatus.reduce(
    (acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = clientsStatus.length;

  // Agrupar status usando as constantes
  const positives = STATUS_GROUPS.POSITIVE.reduce(
    (sum, status) => sum + (statusCounts[status] || 0),
    0,
  );
  const negatives = STATUS_GROUPS.NEGATIVE.reduce(
    (sum, status) => sum + (statusCounts[status] || 0),
    0,
  );
  const completed = STATUS_GROUPS.COMPLETED.reduce(
    (sum, status) => sum + (statusCounts[status] || 0),
    0,
  );
  const analysis = STATUS_GROUPS.ANALYSIS.reduce(
    (sum, status) => sum + (statusCounts[status] || 0),
    0,
  );
  const pending = STATUS_GROUPS.PENDING.reduce(
    (sum, status) => sum + (statusCounts[status] || 0),
    0,
  );

  // REGRA PRINCIPAL: Status da submission reflete o status individual dos clientes
  // Se todos os clientes estiverem aprovados → submission aprovada
  // Se todos os clientes estiverem rejeitados → submission rejeitada
  // Se alguns aprovados e outros não → parcialmente aprovada/rejeitada

  // 1. Todos finalizados - prioridade máxima
  if (completed === total) {
    return SUBMISSION_STATUS.FINALIZADO;
  }

  // 2. Todos aprovados (aprovado/deferido) → SUBMISSION APROVADA ✅
  if (positives === total) {
    return SUBMISSION_STATUS.CONCLUIDO;
  }

  // 3. Todos rejeitados (rejeitado/indeferido/cancelado) → SUBMISSION REJEITADA ❌
  if (negatives === total) {
    return SUBMISSION_STATUS.REJEITADO;
  }

  // 4. Mistura de aprovados e rejeitados → PARCIALMENTE REJEITADA ⚠️
  if (positives > 0 && negatives > 0) {
    return SUBMISSION_STATUS.PARCIALMENTE_REJEITADO;
  }

  // 5. Alguns aprovados, resto pendente/processando → PARCIALMENTE APROVADA ✅
  if (positives > 0 && positives < total) {
    return SUBMISSION_STATUS.PARCIALMENTE_CONCLUIDO;
  }

  // 6. Alguns rejeitados, resto pendente/processando → PARCIALMENTE REJEITADA ❌
  if (negatives > 0 && negatives < total) {
    return SUBMISSION_STATUS.PARCIALMENTE_REJEITADO;
  }

  // 7. Todos pendentes
  if (pending === total) {
    return SUBMISSION_STATUS.AGUARDANDO;
  }

  // 8. Em análise (processando/em_analise)
  if (analysis > 0) {
    return statusCounts.em_analise > 0
      ? SUBMISSION_STATUS.EM_ANALISE_JURIDICA
      : SUBMISSION_STATUS.PROCESSANDO;
  }

  // Fallback
  return SUBMISSION_STATUS.AGUARDANDO;
}

export async function updateSubmissionStatus(
  submissionId: string,
): Promise<void> {
  const newStatus = await calculateSubmissionStatus(submissionId);

  await db
    .update(submission)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(submission.id, submissionId));
}

export async function recalculateSubmissionStatus(
  submissionId: string,
  userId: string,
  isAdmin = false,
) {
  try {
    const [submissionData] = await db
      .select({
        userId: submission.userId,
      })
      .from(submission)
      .where(eq(submission.id, submissionId));

    if (!submissionData) {
      return { success: false, error: "Envio não encontrado" };
    }

    if (!isAdmin && submissionData.userId !== userId) {
      return {
        success: false,
        error: "Sem permissão para atualizar este envio",
      };
    }

    await updateSubmissionStatus(submissionId);

    revalidatePath("/envios/**");
    return { success: true, message: "Status do envio atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao recalcular status do envio:", error);
    return { success: false, error: "Erro ao recalcular status do envio" };
  }
}

/**
 * Função de debug para verificar o status calculado de um envio
 */
export async function debugSubmissionStatus(submissionId: string) {
  const clientsStatus = await db
    .select({
      id: submissionClient.id,
      name: submissionClient.name,
      status: submissionClient.status,
    })
    .from(submissionClient)
    .where(eq(submissionClient.submissionId, submissionId));

  const calculatedStatus = await calculateSubmissionStatus(submissionId);

  return {
    submissionId,
    calculatedStatus,
    totalClients: clientsStatus.length,
    clients: clientsStatus,
    statusBreakdown: clientsStatus.reduce(
      (acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };
}
