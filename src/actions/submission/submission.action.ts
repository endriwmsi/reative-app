"use server";

import { and, asc, desc, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { db } from "@/db/client";
import {
  coupon,
  product,
  submission,
  submissionClient,
  user,
  userProductPrice,
} from "@/db/schema";

interface ClientData {
  name: string;
  document: string;
}

interface SubmissionData {
  title: string;
  productId: number;
  clients: ClientData[];
  notes?: string;
  couponId?: string;
}

/**
 * Calcula o status do envio baseado nos status dos clientes
 * Status possíveis:
 * - "aguardando": Todos os clientes estão pendentes
 * - "processando": Alguns clientes estão sendo processados
 * - "parcialmente_concluido": Alguns clientes aprovados/deferidos, outros ainda pendentes/processando
 * - "concluido": Todos os clientes aprovados/deferidos/finalizados
 * - "parcialmente_rejeitado": Alguns clientes rejeitados/indeferidos, outros em diferentes status
 * - "rejeitado": Todos os clientes rejeitados/indeferidos
 * - "em_analise_juridica": Maioria dos clientes em análise pós-pagamento
 * - "finalizado": Todos os clientes finalizados
 */
async function calculateSubmissionStatus(
  submissionId: string,
): Promise<string> {
  const clientsStatus = await db
    .select({
      status: submissionClient.status,
    })
    .from(submissionClient)
    .where(eq(submissionClient.submissionId, submissionId));

  if (clientsStatus.length === 0) {
    return "aguardando";
  }

  const statusCounts = clientsStatus.reduce(
    (acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = clientsStatus.length;

  // Status pré-pagamento
  const pendentes = statusCounts.pendente || 0;
  const processando = statusCounts.processando || 0;
  const aprovados = statusCounts.aprovado || 0;
  const rejeitados = statusCounts.rejeitado || 0;

  // Status pós-pagamento (processo jurídico)
  const deferidos = statusCounts.deferido || 0;
  const indeferidos = statusCounts.indeferido || 0;
  const emAnalise = statusCounts.em_analise || 0;
  const finalizados = statusCounts.finalizado || 0;
  const cancelados = statusCounts.cancelado || 0;

  // Agrupar status similares
  const positivos = aprovados + deferidos; // Status de sucesso
  const negativos = rejeitados + indeferidos + cancelados; // Status de insucesso
  const concluidos = finalizados; // Status final
  const analise = processando + emAnalise; // Status de análise

  // Todos finalizados
  if (concluidos === total) {
    return "finalizado";
  }

  // Todos com resultado positivo (aprovado/deferido)
  if (positivos === total) {
    return "concluido";
  }

  // Todos com resultado negativo (rejeitado/indeferido/cancelado)
  if (negativos === total) {
    return "rejeitado";
  }

  // Todos pendentes
  if (pendentes === total) {
    return "aguardando";
  }

  // Maioria em análise (processando/em_analise)
  if (analise > total / 2) {
    return emAnalise > 0 ? "em_analise_juridica" : "processando";
  }

  // Alguns em análise
  if (analise > 0) {
    return emAnalise > 0 ? "em_analise_juridica" : "processando";
  }

  // Tem resultados positivos e outros status
  if (positivos > 0 && positivos < total) {
    return negativos > 0 ? "parcialmente_rejeitado" : "parcialmente_concluido";
  }

  // Tem resultados negativos mas não todos
  if (negativos > 0) {
    return "parcialmente_rejeitado";
  }

  return "aguardando";
}

/**
 * Atualiza o status do envio baseado nos status dos clientes
 */
async function updateSubmissionStatus(submissionId: string): Promise<void> {
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
export async function createSubmission(
  userId: string,
  submissionData: SubmissionData,
) {
  try {
    // Verificar se o produto existe e buscar preço
    const [productData] = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.id, submissionData.productId),
          eq(product.isActive, true),
        ),
      );

    if (!productData) {
      return { success: false, error: "Produto não encontrado" };
    }

    // Verificar se o usuário foi indicado para buscar preço do indicador
    const [userData] = await db
      .select({
        id: user.id,
        referredBy: user.referredBy,
      })
      .from(user)
      .where(eq(user.id, userId));

    let priceUserId = userId; // Por padrão, usar o próprio usuário

    // Se o usuário foi indicado, buscar o ID do indicador
    if (userData?.referredBy) {
      const [referrer] = await db
        .select({
          id: user.id,
        })
        .from(user)
        .where(eq(user.referralCode, userData.referredBy));

      if (referrer) {
        priceUserId = referrer.id;
      }
    }

    const [userPrice] = await db
      .select()
      .from(userProductPrice)
      .where(
        and(
          eq(userProductPrice.productId, submissionData.productId),
          eq(userProductPrice.userId, priceUserId),
        ),
      );

    let unitPrice = userPrice?.customPrice || productData.basePrice;
    const quantity = submissionData.clients.length;

    // Aplicar cupom se fornecido
    let couponId: string | null = null;
    if (submissionData.couponId) {
      const [couponData] = await db
        .select()
        .from(coupon)
        .where(
          and(
            eq(coupon.id, submissionData.couponId),
            eq(coupon.isActive, true),
          ),
        );

      if (couponData) {
        const originalPrice = parseFloat(unitPrice);
        let discountedPrice = originalPrice;

        if (couponData.discountType === "percentage") {
          discountedPrice =
            originalPrice *
            (1 - parseFloat(couponData.discountValue.toString()) / 100);
        } else {
          discountedPrice =
            originalPrice - parseFloat(couponData.discountValue.toString());
        }

        // Garantir que o preço não seja negativo
        discountedPrice = Math.max(0, discountedPrice);
        unitPrice = discountedPrice.toFixed(2);
        couponId = couponData.id;

        // Incrementar contador de uso do cupom
        await db
          .update(coupon)
          .set({ currentUses: couponData.currentUses + 1 })
          .where(eq(coupon.id, couponData.id));
      }
    }

    const totalAmount = (parseFloat(unitPrice) * quantity).toString();

    // Criar o envio
    const [newSubmission] = await db
      .insert(submission)
      .values({
        id: crypto.randomUUID(),
        userId,
        productId: submissionData.productId,
        title: submissionData.title,
        totalAmount,
        unitPrice,
        quantity,
        notes: submissionData.notes,
        couponId,
      })
      .returning();

    const clientsToInsert = submissionData.clients.map((client) => ({
      id: crypto.randomUUID(),
      submissionId: newSubmission.id,
      name: client.name,
      document: client.document,
    }));

    await db.insert(submissionClient).values(clientsToInsert);

    // Atualizar status do envio baseado nos status dos clientes (todos serão 'pendente' inicialmente)
    await updateSubmissionStatus(newSubmission.id);

    // Nota: As comissões serão criadas automaticamente quando o pagamento for confirmado
    // via payment.action.ts -> checkPaymentStatus()

    revalidatePath("/envios");
    return {
      success: true,
      data: newSubmission,
      message: `Envio criado com sucesso! ${quantity} cliente(s) adicionado(s).`,
    };
  } catch (error) {
    console.error("Erro ao criar envio:", error);
    return { success: false, error: "Erro ao criar envio" };
  }
}

export async function processExcelFile(
  file: File,
): Promise<{ success: boolean; data?: ClientData[]; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as unknown[][];

    if (jsonData.length < 2) {
      return {
        success: false,
        error:
          "Arquivo deve conter pelo menos um cabeçalho e uma linha de dados",
      };
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    // Mapear colunas (flexível para diferentes formatos)
    const getColumnIndex = (possibleNames: string[]) => {
      return headers.findIndex((header) => {
        if (!header) return false;
        const headerStr = header.toString().toLowerCase().trim();
        return possibleNames.some((name) => {
          const nameStr = name.toLowerCase().trim();
          // Busca exata primeiro, depois busca por inclusão
          return headerStr === nameStr || headerStr.includes(nameStr);
        });
      });
    };

    const nameIndex = getColumnIndex(["nome", "name", "cliente"]);
    const documentoIndex = getColumnIndex(["documento", "cpf", "cnpj"]);

    if (nameIndex === -1) {
      return { success: false, error: "Coluna 'nome' é obrigatória" };
    }

    const clients: ClientData[] = [];

    for (const row of dataRows) {
      const name = row[nameIndex]?.toString().trim();
      if (!name) continue;

      const document = row[documentoIndex]?.toString().trim() || "";
      if (!document) continue;

      const client: ClientData = {
        name,
        document,
      };

      clients.push(client);
    }

    if (clients.length === 0) {
      return {
        success: false,
        error: "Nenhum cliente válido encontrado no arquivo",
      };
    }

    return { success: true, data: clients };
  } catch (error) {
    console.error("Erro ao processar arquivo Excel:", error);
    return { success: false, error: "Erro ao processar arquivo Excel" };
  }
}

export async function getUserSubmissions(userId: string, isAdmin = false) {
  try {
    let submissions: unknown[];

    if (isAdmin) {
      // Admin vê todos os envios
      submissions = await db
        .select({
          id: submission.id,
          title: submission.title,
          totalAmount: submission.totalAmount,
          unitPrice: submission.unitPrice,
          quantity: submission.quantity,
          status: submission.status,
          notes: submission.notes,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          productName: product.name,
          productCategory: product.category,
          userName: user.name,
          userEmail: user.email,
          isPaid: submission.isPaid,
          paymentDate: submission.paymentDate,
          paymentId: submission.paymentId,
          paymentStatus: submission.paymentStatus,
        })
        .from(submission)
        .leftJoin(product, eq(submission.productId, product.id))
        .leftJoin(user, eq(submission.userId, user.id))
        .orderBy(desc(submission.createdAt));
    } else {
      // Usuário vê seus envios + envios de usuários indicados por ele
      const [currentUser] = await db
        .select({ referralCode: user.referralCode })
        .from(user)
        .where(eq(user.id, userId));

      if (!currentUser) {
        return { success: false, error: "Usuário não encontrado" };
      }

      submissions = await db
        .select({
          id: submission.id,
          title: submission.title,
          totalAmount: submission.totalAmount,
          unitPrice: submission.unitPrice,
          quantity: submission.quantity,
          status: submission.status,
          notes: submission.notes,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          productName: product.name,
          productCategory: product.category,
          userName: user.name,
          userEmail: user.email,
          canViewClients: eq(submission.userId, userId), // Só pode ver clientes dos próprios envios
          isPaid: submission.isPaid,
          paymentDate: submission.paymentDate,
          paymentId: submission.paymentId,
          paymentStatus: submission.paymentStatus,
        })
        .from(submission)
        .leftJoin(product, eq(submission.productId, product.id))
        .leftJoin(user, eq(submission.userId, user.id))
        .where(
          or(
            eq(submission.userId, userId), // Próprios envios
            eq(user.referredBy, currentUser.referralCode), // Envios de indicados
          ),
        )
        .orderBy(desc(submission.createdAt));
    }

    return { success: true, data: submissions };
  } catch (error) {
    console.error("Erro ao buscar envios:", error);
    return { success: false, error: "Erro ao buscar envios" };
  }
}

export async function getSubmissionClients(
  submissionId: string,
  userId: string,
  isAdmin = false,
) {
  try {
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

export async function deleteSubmission(
  submissionId: string,
  userId: string,
  isAdmin = false,
) {
  try {
    const [submissionData] = await db
      .select({
        userId: submission.userId,
        isPaid: submission.isPaid,
      })
      .from(submission)
      .where(eq(submission.id, submissionId));

    if (!submissionData) {
      return { success: false, error: "Envio não encontrado" };
    }

    if (!isAdmin && submissionData.userId !== userId) {
      return { success: false, error: "Sem permissão para deletar este envio" };
    }

    // Verificar se o envio está pago
    if (submissionData.isPaid) {
      return {
        success: false,
        error: "Não é possível deletar envios que já foram pagos",
      };
    }

    await db.delete(submission).where(eq(submission.id, submissionId));

    revalidatePath("/envios");
    return { success: true, message: "Envio deletado com sucesso" };
  } catch (error) {
    console.error("Erro ao deletar envio:", error);
    return { success: false, error: "Erro ao deletar envio" };
  }
}

export async function deleteSubmissionClient(
  clientId: string,
  userId: string,
  isAdmin = false,
) {
  try {
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

/**
 * Deletar múltiplos envios (apenas não pagos)
 */
export async function deleteMultipleSubmissions(
  submissionIds: string[],
  userId: string,
  isAdmin = false,
) {
  try {
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

/**
 * Atualizar status de um cliente
 */
export async function updateClientStatus(
  clientId: string,
  newStatus: string,
  userId: string,
  isAdmin = false,
) {
  try {
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

/**
 * Atualizar status de múltiplos clientes
 */
export async function updateMultipleClientsStatus(
  clientIds: string[],
  newStatus: string,
  userId: string,
  isAdmin = false,
) {
  try {
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

/**
 * Deletar múltiplos clientes
 */
export async function deleteMultipleClients(
  clientIds: string[],
  userId: string,
  isAdmin = false,
) {
  try {
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

/**
 * Busca um envio específico por ID
 */
export async function getSubmissionById(
  submissionId: string,
  userId: string,
  isAdmin: boolean = false,
) {
  try {
    const whereCondition = isAdmin
      ? eq(submission.id, submissionId)
      : and(eq(submission.id, submissionId), eq(submission.userId, userId));

    const result = await db
      .select({
        id: submission.id,
        title: submission.title,
        totalAmount: submission.totalAmount,
        unitPrice: submission.unitPrice,
        quantity: submission.quantity,
        status: submission.status,
        notes: submission.notes,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        productName: product.name,
        productCategory: product.category,
        userName: user.name,
        userEmail: user.email,
        userId: submission.userId,
        productId: submission.productId,
      })
      .from(submission)
      .innerJoin(product, eq(submission.productId, product.id))
      .innerJoin(user, eq(submission.userId, user.id))
      .where(whereCondition)
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Envio não encontrado" };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Erro ao buscar envio:", error);
    return { success: false, error: "Erro ao buscar envio" };
  }
}
