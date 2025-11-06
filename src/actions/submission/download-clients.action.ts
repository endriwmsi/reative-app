"use server";

import { and, eq, inArray, or, type SQL } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { product, submission, submissionClient, user } from "@/db/schema";

export interface ClientDownloadData {
  clientId: string;
  clientName: string;
  clientDocument: string;
  clientStatus: string;
  submissionId: string;
  submissionTitle: string;
  submissionCreatedAt: Date;
  submissionStatus: string;
  submissionIsPaid: boolean;
  productId: number;
  productName: string;
  productCategory: string;
  userName: string;
  userEmail: string;
}

export interface ProductClientsGroup {
  productId: number;
  productName: string;
  productCategory: string;
  clients: ClientDownloadData[];
  totalClients: number;
  totalSubmissions: number;
}

export async function getClientsGroupedByProduct(
  userId: string,
  isAdmin = false,
  submissionIds?: string[],
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/login");
    }

    // Query para buscar todos os clientes com informações do envio, produto e usuário
    let whereCondition: SQL | undefined;

    if (isAdmin) {
      // Admin pode ver todos os envios
      whereCondition = submissionIds
        ? inArray(submission.id, submissionIds)
        : undefined;
    } else {
      // Usuário comum só vê seus próprios envios e de seus indicados
      const [currentUser] = await db
        .select({ referralCode: user.referralCode })
        .from(user)
        .where(eq(user.id, userId));

      if (!currentUser) {
        return { success: false, error: "Usuário não encontrado" };
      }

      // Incluir envios do próprio usuário e dos seus indicados
      const userCondition = or(
        eq(submission.userId, userId),
        eq(user.referredBy, currentUser.referralCode),
      );

      // Se IDs específicos foram fornecidos, filtrar por eles também
      if (submissionIds) {
        whereCondition = and(
          userCondition,
          inArray(submission.id, submissionIds),
        );
      } else {
        whereCondition = userCondition;
      }
    }

    const clientsData = await db
      .select({
        clientId: submissionClient.id,
        clientName: submissionClient.name,
        clientDocument: submissionClient.document,
        clientStatus: submissionClient.status,
        submissionId: submission.id,
        submissionTitle: submission.title,
        submissionCreatedAt: submission.createdAt,
        submissionStatus: submission.status,
        submissionIsPaid: submission.isPaid,
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        userName: user.name,
        userEmail: user.email,
      })
      .from(submissionClient)
      .innerJoin(submission, eq(submissionClient.submissionId, submission.id))
      .innerJoin(product, eq(submission.productId, product.id))
      .innerJoin(user, eq(submission.userId, user.id))
      .where(whereCondition)
      .orderBy(product.name, submission.createdAt, submissionClient.name);

    // Agrupar os dados por produto
    const groupedData = new Map<number, ProductClientsGroup>();

    for (const clientData of clientsData) {
      const productId = clientData.productId;

      if (!groupedData.has(productId)) {
        groupedData.set(productId, {
          productId: clientData.productId,
          productName: clientData.productName,
          productCategory: clientData.productCategory,
          clients: [],
          totalClients: 0,
          totalSubmissions: 0,
        });
      }

      const group = groupedData.get(productId);
      if (!group) continue;

      group.clients.push({
        clientId: clientData.clientId,
        clientName: clientData.clientName,
        clientDocument: clientData.clientDocument,
        clientStatus: clientData.clientStatus,
        submissionId: clientData.submissionId,
        submissionTitle: clientData.submissionTitle,
        submissionCreatedAt: clientData.submissionCreatedAt,
        submissionStatus: clientData.submissionStatus,
        submissionIsPaid: clientData.submissionIsPaid,
        productId: clientData.productId,
        productName: clientData.productName,
        productCategory: clientData.productCategory,
        userName: clientData.userName,
        userEmail: clientData.userEmail,
      });
    }

    // Calcular totais para cada grupo
    for (const group of groupedData.values()) {
      group.totalClients = group.clients.length;
      group.totalSubmissions = new Set(
        group.clients.map((c) => c.submissionId),
      ).size;
    }

    const result = Array.from(groupedData.values());

    return {
      success: true,
      data: result,
      totalProducts: result.length,
      totalClients: clientsData.length,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes agrupados por produto:", error);
    return { success: false, error: "Erro ao buscar dados para download" };
  }
}
