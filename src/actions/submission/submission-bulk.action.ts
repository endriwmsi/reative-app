"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { submission, submissionClient } from "@/db/schema";
import { updateSubmissionStatus } from "./submission-status.action";

export async function deleteMultipleSubmissions(
  submissionIds: string[],
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

    if (submissionIds.length === 0) {
      return { success: false, error: "Nenhum envio selecionado" };
    }

    // Verificar se todos os envios existem e se o usuário tem permissão
    const submissions = await db
      .select({
        id: submission.id,
        userId: submission.userId,
        isPaid: submission.isPaid,
        title: submission.title,
      })
      .from(submission)
      .where(
        and(
          or(...submissionIds.map((id) => eq(submission.id, id))),
          isAdmin ? undefined : eq(submission.userId, userId),
        ),
      );

    if (submissions.length !== submissionIds.length) {
      return { success: false, error: "Alguns envios não foram encontrados" };
    }

    // Verificar se algum envio já foi pago
    const paidSubmissions = submissions.filter((s) => s.isPaid);
    if (paidSubmissions.length > 0) {
      return {
        success: false,
        error: `Não é possível deletar envios pagos: ${paidSubmissions.map((s) => s.title).join(", ")}`,
      };
    }

    // Deletar todos os envios
    await db
      .delete(submission)
      .where(or(...submissionIds.map((id) => eq(submission.id, id))));

    revalidatePath("/envios");
    return {
      success: true,
      message: `${submissions.length} envio(s) deletado(s) com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao deletar envios:", error);
    return { success: false, error: "Erro ao deletar envios" };
  }
}

export async function updateMultipleClientsStatus(
  clientIds: string[],
  newStatus: string,
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

    if (clientIds.length === 0) {
      return { success: false, error: "Nenhum cliente selecionado" };
    }

    // Verificar se todos os clientes existem e se o usuário tem permissão
    const clients = await db
      .select({
        id: submissionClient.id,
        submissionId: submissionClient.submissionId,
        submissionUserId: submission.userId,
      })
      .from(submissionClient)
      .leftJoin(submission, eq(submissionClient.submissionId, submission.id))
      .where(
        and(
          or(...clientIds.map((id) => eq(submissionClient.id, id))),
          isAdmin ? undefined : eq(submission.userId, userId),
        ),
      );

    if (clients.length !== clientIds.length) {
      return { success: false, error: "Alguns clientes não foram encontrados" };
    }

    // Atualizar status de todos os clientes
    await db
      .update(submissionClient)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(or(...clientIds.map((id) => eq(submissionClient.id, id))));

    // Atualizar status dos envios afetados
    const affectedSubmissions = [
      ...new Set(clients.map((c) => c.submissionId)),
    ];
    for (const submissionId of affectedSubmissions) {
      await updateSubmissionStatus(submissionId);
    }

    revalidatePath("/envios/**");
    return {
      success: true,
      message: `Status de ${clients.length} cliente(s) atualizado com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao atualizar status dos clientes:", error);
    return { success: false, error: "Erro ao atualizar status dos clientes" };
  }
}

export async function deleteMultipleClients(
  clientIds: string[],
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

    if (clientIds.length === 0) {
      return { success: false, error: "Nenhum cliente selecionado" };
    }

    // Verificar se todos os clientes existem e se o usuário tem permissão
    const clients = await db
      .select({
        id: submissionClient.id,
        submissionId: submissionClient.submissionId,
        submissionUserId: submission.userId,
        isPaid: submission.isPaid,
      })
      .from(submissionClient)
      .leftJoin(submission, eq(submissionClient.submissionId, submission.id))
      .where(
        and(
          or(...clientIds.map((id) => eq(submissionClient.id, id))),
          isAdmin ? undefined : eq(submission.userId, userId),
        ),
      );

    if (clients.length !== clientIds.length) {
      return { success: false, error: "Alguns clientes não foram encontrados" };
    }

    // Verificar se algum cliente pertence a um envio pago
    const paidClients = clients.filter((c) => c.isPaid);
    if (paidClients.length > 0) {
      return {
        success: false,
        error: "Não é possível deletar clientes de envios já pagos",
      };
    }

    // Deletar todos os clientes
    await db
      .delete(submissionClient)
      .where(or(...clientIds.map((id) => eq(submissionClient.id, id))));

    // Atualizar quantidade e valor total dos envios afetados
    const affectedSubmissions = [
      ...new Set(clients.map((c) => c.submissionId)),
    ];

    for (const submissionId of affectedSubmissions) {
      const [submissionInfo] = await db
        .select({
          unitPrice: submission.unitPrice,
        })
        .from(submission)
        .where(eq(submission.id, submissionId));

      const remainingClients = await db
        .select({ count: submissionClient.id })
        .from(submissionClient)
        .where(eq(submissionClient.submissionId, submissionId));

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
        .where(eq(submission.id, submissionId));

      // Atualizar status do envio baseado nos clientes restantes
      await updateSubmissionStatus(submissionId);
    }

    revalidatePath("/envios/**");
    return {
      success: true,
      message: `${clients.length} cliente(s) removido(s) com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao deletar clientes:", error);
    return { success: false, error: "Erro ao deletar clientes" };
  }
}
