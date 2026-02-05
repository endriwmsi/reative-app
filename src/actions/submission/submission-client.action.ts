"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  type SubmissionClientStatus,
  submission,
  submissionClient,
  user,
} from "@/db/schema";
import { updateSubmissionStatus } from "./submission-status.action";

export async function getSubmissionClients(
  submissionId: string,
  userId: string,
  isAdmin = false,
) {
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

    const [submissionData] = await db
      .select({
        userId: submission.userId,
        userReferralCode: user.referralCode,
        isPaid: submission.isPaid,
      })
      .from(submission)
      .leftJoin(user, eq(submission.userId, user.id))
      .where(eq(submission.id, submissionId));

    if (!submissionData) {
      return { success: false, error: "Envio não encontrado" };
    }

    // Verificar permissões
    if (!isAdmin && submissionData.userId !== userId) {
      return { success: false, error: "Sem permissão para acessar este envio" };
    }

    const clients = await db
      .select({
        id: submissionClient.id,
        submissionId: submissionClient.submissionId,
        name: submissionClient.name,
        document: submissionClient.document,
        status: submissionClient.status,
        notes: submissionClient.notes,
        createdAt: submissionClient.createdAt,
        updatedAt: submissionClient.updatedAt,
        isPaid: submission.isPaid,
      })
      .from(submissionClient)
      .innerJoin(submission, eq(submissionClient.submissionId, submission.id))
      .where(eq(submissionClient.submissionId, submissionId))
      .orderBy(asc(submissionClient.name));

    return { success: true, data: clients };
  } catch (error) {
    console.error("Erro ao buscar clientes do envio:", error);
    return { success: false, error: "Erro ao buscar clientes" };
  }
}

export async function deleteSubmissionClient(
  clientId: string,
  userId: string,
  isAdmin = false,
) {
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

    // Verificar se o usuário pode deletar este cliente
    const [clientData] = await db
      .select({
        submissionId: submissionClient.submissionId,
        submissionUserId: submission.userId,
      })
      .from(submissionClient)
      .leftJoin(submission, eq(submissionClient.submissionId, submission.id))
      .where(eq(submissionClient.id, clientId));

    if (!clientData) {
      return { success: false, error: "Cliente não encontrado" };
    }

    if (!isAdmin && clientData.submissionUserId !== userId) {
      return {
        success: false,
        error: "Sem permissão para deletar este cliente",
      };
    }

    // Deletar cliente
    await db.delete(submissionClient).where(eq(submissionClient.id, clientId));

    // Atualizar quantidade e valor total do envio
    const [submissionInfo] = await db
      .select({
        unitPrice: submission.unitPrice,
      })
      .from(submission)
      .where(eq(submission.id, clientData.submissionId));

    const remainingClients = await db
      .select({ count: submissionClient.id })
      .from(submissionClient)
      .where(eq(submissionClient.submissionId, clientData.submissionId));

    const newQuantity = remainingClients.length;
    const newTotalAmount = (
      parseFloat(submissionInfo.unitPrice) * newQuantity
    ).toString();

    await db
      .update(submission)
      .set({
        quantity: newQuantity,
        totalAmount: newTotalAmount,
        updatedAt: new Date(),
      })
      .where(eq(submission.id, clientData.submissionId));

    // Atualizar status do envio baseado nos clientes restantes
    await updateSubmissionStatus(clientData.submissionId);

    revalidatePath("envios/**");
    return { success: true, message: "Cliente removido com sucesso" };
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return { success: false, error: "Erro ao deletar cliente" };
  }
}

export async function updateClientStatus(
  clientId: string,
  newStatus: SubmissionClientStatus,
  userId: string,
  isAdmin = false,
) {
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

    // Verificar se o usuário pode atualizar este cliente
    const [clientData] = await db
      .select({
        submissionId: submissionClient.submissionId,
        submissionUserId: submission.userId,
        currentStatus: submissionClient.status,
      })
      .from(submissionClient)
      .leftJoin(submission, eq(submissionClient.submissionId, submission.id))
      .where(eq(submissionClient.id, clientId));

    if (!clientData) {
      return { success: false, error: "Cliente não encontrado" };
    }

    if (!isAdmin && clientData.submissionUserId !== userId) {
      return {
        success: false,
        error: "Sem permissão para atualizar este cliente",
      };
    }

    // Atualizar status do cliente
    await db
      .update(submissionClient)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(submissionClient.id, clientId));

    // Atualizar status do envio baseado nos status dos clientes
    await updateSubmissionStatus(clientData.submissionId);

    revalidatePath("/envios/**");
    return { success: true, message: "Status atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar status do cliente:", error);
    return { success: false, error: "Erro ao atualizar status" };
  }
}
