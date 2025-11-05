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

  // Todos finalizados
  if (completed === total) {
    return SUBMISSION_STATUS.FINALIZADO;
  }

  // Todos com resultado positivo (aprovado/deferido)
  if (positives === total) {
    return SUBMISSION_STATUS.CONCLUIDO;
  }

  // Todos com resultado negativo (rejeitado/indeferido/cancelado)
  if (negatives === total) {
    return SUBMISSION_STATUS.REJEITADO;
  }

  // Todos pendentes
  if (pending === total) {
    return SUBMISSION_STATUS.AGUARDANDO;
  }

  // Maioria em análise (processando/em_analise)
  if (analysis > total / 2) {
    return statusCounts.em_analise > 0
      ? SUBMISSION_STATUS.EM_ANALISE_JURIDICA
      : SUBMISSION_STATUS.PROCESSANDO;
  }

  // Alguns em análise
  if (analysis > 0) {
    return statusCounts.em_analise > 0
      ? SUBMISSION_STATUS.EM_ANALISE_JURIDICA
      : SUBMISSION_STATUS.PROCESSANDO;
  }

  // Tem resultados positivos e outros status
  if (positives > 0 && positives < total) {
    return negatives > 0
      ? SUBMISSION_STATUS.PARCIALMENTE_REJEITADO
      : SUBMISSION_STATUS.PARCIALMENTE_CONCLUIDO;
  }

  // Tem resultados negativos mas não todos
  if (negatives > 0) {
    return SUBMISSION_STATUS.PARCIALMENTE_REJEITADO;
  }

  return SUBMISSION_STATUS.AGUARDANDO;
}

/**
 * Atualiza o status do envio baseado nos status dos clientes
 */
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

/**
 * Função exportada para recalcular status de um envio específico
 */
export async function recalculateSubmissionStatus(
  submissionId: string,
  userId: string,
  isAdmin = false,
) {
  try {
    // Verificar se o usuário tem permissão para atualizar este envio
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
