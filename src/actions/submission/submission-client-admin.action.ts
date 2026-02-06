"use server";

import { and, count, eq, ilike, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/actions/user/user-management.action";
import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  type SubmissionClientStatus,
  submission,
  submissionClient,
  user,
} from "@/db/schema";

export interface SubmissionClientWithUser {
  id: string;
  submissionId: string;
  name: string;
  document: string;
  status: SubmissionClientStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userEmail: string | null;
}

export interface GetAllSubmissionClientsParams {
  page?: number;
  pageSize?: number;
  name?: string;
  document?: string;
  status?: SubmissionClientStatus;
}

export interface GetAllSubmissionClientsResponse {
  success: boolean;
  data?: SubmissionClientWithUser[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  error?: string;
}

export async function getAllSubmissionClients(
  params: GetAllSubmissionClientsParams = {},
): Promise<GetAllSubmissionClientsResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      redirect("/login");
    }

    // Verificar se o usuário é admin
    const adminCheck = await isUserAdmin(session.user.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return {
        success: false,
        error: "Usuário não tem permissão de administrador",
      };
    }

    const { page = 1, pageSize = 10, name, document, status } = params;
    const offset = (page - 1) * pageSize;

    // Construir condições de filtro
    const conditions = [];

    if (name && name.trim()) {
      conditions.push(ilike(submissionClient.name, `%${name.trim()}%`));
    }

    if (document && document.trim()) {
      // Suporte para múltiplos documentos separados por espaço
      const documents = document
        .trim()
        .split(/\s+/)
        .filter((d) => d.length > 0);

      if (documents.length === 1) {
        conditions.push(ilike(submissionClient.document, `%${documents[0]}%`));
      } else if (documents.length > 1) {
        // Usar OR para buscar todos os documentos
        const documentConditions = documents.map((doc) =>
          ilike(submissionClient.document, `%${doc}%`),
        );
        conditions.push(sql`(${sql.join(documentConditions, sql` OR `)})`);
      }
    }

    if (status) {
      conditions.push(eq(submissionClient.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Buscar dados com paginação
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
        userName: user.name,
        userEmail: user.email,
      })
      .from(submissionClient)
      .innerJoin(submission, eq(submissionClient.submissionId, submission.id))
      .leftJoin(user, eq(submission.userId, user.id))
      .where(whereClause)
      .orderBy(submissionClient.createdAt)
      .limit(pageSize)
      .offset(offset);

    // Buscar contagem total
    const [countResult] = await db
      .select({ count: count() })
      .from(submissionClient)
      .innerJoin(submission, eq(submissionClient.submissionId, submission.id))
      .where(whereClause);

    const totalCount = countResult?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: clients,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return { success: false, error: "Erro ao buscar clientes" };
  }
}

export interface UpdateClientStatusBulkParams {
  clientIds: string[];
  newStatus: SubmissionClientStatus;
}

export interface UpdateClientStatusBulkResponse {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

export async function updateClientStatusBulk(
  params: UpdateClientStatusBulkParams,
): Promise<UpdateClientStatusBulkResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      redirect("/login");
    }

    // Verificar se o usuário é admin
    const adminCheck = await isUserAdmin(session.user.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return {
        success: false,
        error: "Usuário não tem permissão de administrador",
      };
    }

    const { clientIds, newStatus } = params;

    if (!clientIds || clientIds.length === 0) {
      return { success: false, error: "Nenhum cliente selecionado" };
    }

    // Atualizar status em batch
    await db
      .update(submissionClient)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        sql`${submissionClient.id} IN ${sql.raw(`('${clientIds.join("','")}')`)}`,
      );

    return {
      success: true,
      updatedCount: clientIds.length,
    };
  } catch (error) {
    console.error("Erro ao atualizar status em bulk:", error);
    return { success: false, error: "Erro ao atualizar status dos clientes" };
  }
}

export async function updateSingleClientStatus(
  clientId: string,
  newStatus: SubmissionClientStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      redirect("/login");
    }

    // Verificar se o usuário é admin
    const adminCheck = await isUserAdmin(session.user.id);
    if (!adminCheck.success || !adminCheck.isAdmin) {
      return {
        success: false,
        error: "Usuário não tem permissão de administrador",
      };
    }

    await db
      .update(submissionClient)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(submissionClient.id, clientId));

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do cliente:", error);
    return { success: false, error: "Erro ao atualizar status" };
  }
}
