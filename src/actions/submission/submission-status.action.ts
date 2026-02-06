"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  SUBMISSION_STATUS,
  type SubmissionStatus,
} from "@/constants/submission-status";
import { db } from "@/db/client";
import { submission, submissionClient } from "@/db/schema";

/**
 * LÓGICA DO STATUS DA SUBMISSION:
 *
 * O status da submission reflete o status predominante dos clientes:
 *
 * ✅ Pendente (pending): Maioria dos clientes pendentes
 * ✅ Processando (processing): Maioria dos clientes processando
 * ✅ APROVADO (approved): Maioria dos clientes aprovados
 * ❌ REJEITADO (rejected): Maioria dos clientes rejeitados
 * ❌ CANCELADO (cancelled): Maioria dos clientes cancelados
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
    return SUBMISSION_STATUS.PENDING;
  }

  // Contar quantos clientes têm cada status
  const statusCounts = clientsStatus.reduce(
    (acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = clientsStatus.length;

  // Contar por categoria
  const pending = statusCounts.pending || 0;
  const processing = statusCounts.processing || 0;
  const approved = statusCounts.approved || 0;
  const rejected = statusCounts.rejected || 0;
  const cancelled = statusCounts.cancelled || 0;

  // REGRA: O status da submission é determinado pela maioria dos clientes
  // Se todos têm o mesmo status → submission tem esse status
  // Se há mistura → determinamos pela maioria

  // 1. Todos aprovados → APPROVED
  if (approved === total) {
    return SUBMISSION_STATUS.APPROVED;
  }

  // 2. Todos rejeitados → REJECTED
  if (rejected === total) {
    return SUBMISSION_STATUS.REJECTED;
  }

  // 3. Todos cancelados → CANCELLED
  if (cancelled === total) {
    return SUBMISSION_STATUS.CANCELLED;
  }

  // 4. Todos pendentes → PENDING
  if (pending === total) {
    return SUBMISSION_STATUS.PENDING;
  }

  // 5. Todos processando → PROCESSING
  if (processing === total) {
    return SUBMISSION_STATUS.PROCESSING;
  }

  // 6. Status misto - determinar pela maioria
  const statusPriority = [
    { status: SUBMISSION_STATUS.APPROVED, count: approved },
    { status: SUBMISSION_STATUS.REJECTED, count: rejected },
    { status: SUBMISSION_STATUS.CANCELLED, count: cancelled },
    { status: SUBMISSION_STATUS.PROCESSING, count: processing },
    { status: SUBMISSION_STATUS.PENDING, count: pending },
  ];

  // Ordenar por quantidade (maior primeiro)
  statusPriority.sort((a, b) => b.count - a.count);

  // Retorna o status com maior contagem
  return statusPriority[0].status;
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
