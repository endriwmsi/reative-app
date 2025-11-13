"use server";

import { and, desc, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  coupon,
  product,
  submission,
  submissionClient,
  user,
  userProductPrice,
} from "@/db/schema";
import type { ClientData } from "./submission-excel.action";
import { updateSubmissionStatus } from "./submission-status.action";

interface SubmissionData {
  title: string;
  productId: number;
  clients: ClientData[];
  notes?: string;
  couponId?: string;
}

export async function createSubmission(
  userId: string,
  submissionData: SubmissionData,
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

    const [userData] = await db
      .select({
        id: user.id,
        referredBy: user.referredBy,
      })
      .from(user)
      .where(eq(user.id, userId));

    let priceUserId = userId;

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

        discountedPrice = Math.max(0, discountedPrice);
        unitPrice = discountedPrice.toFixed(2);
        couponId = couponData.id;

        await db
          .update(coupon)
          .set({ currentUses: couponData.currentUses + 1 })
          .where(eq(coupon.id, couponData.id));
      }
    }

    const totalAmount = (parseFloat(unitPrice) * quantity).toString();

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
    await updateSubmissionStatus(newSubmission.id);

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

export async function getUserSubmissions(userId: string, isAdmin = false) {
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

    let submissions: unknown[];

    if (isAdmin) {
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
          userPhone: user.phone,
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
          canViewClients: eq(submission.userId, userId),
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
            eq(submission.userId, userId),
            eq(user.referredBy, currentUser.referralCode),
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

export async function deleteSubmission(
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

export async function getSubmissionById(
  submissionId: string,
  userId: string,
  isAdmin: boolean = false,
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
