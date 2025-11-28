// src/app/actions/create-billing.ts
"use server";

import AbacatePay from "abacatepay-nodejs-sdk";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { subscription, user } from "@/db/schema";

export async function createBillingAction(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  try {
    const abacatePay = AbacatePay(process.env.ABACATEPAY_API_KEY || "");

    const [existingUser] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        cellphone: user.phone,
        cpf: user.cpf,
        cnpj: user.cnpj,
        abacatePayCustomerId: user.abacatePayCustomerId,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!existingUser) {
      return { error: "Usuário não encontrado." };
    }

    if (!existingUser.abacatePayCustomerId) {
      return {
        error:
          "Usuário não possui um Customer ID na AbacatePay. Rode a action de criar usuário primeiro.",
      };
    }

    // Verificar se já existe uma assinatura para o usuário
    const [userSubscription] = await db
      .select({
        abacatePayBillingId: subscription.abacatePayBillingId,
        pixQrCodeCreatedAt: subscription.pixQrCodeCreatedAt,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId));

    const fifteenMinutesAgo = new Date(Date.now() - 60 * 15 * 1000); // 15 minutos atrás

    if (
      userSubscription?.abacatePayBillingId &&
      userSubscription.pixQrCodeCreatedAt &&
      userSubscription.pixQrCodeCreatedAt > fifteenMinutesAgo
    ) {
      // Já existe um PixQRCodeId válido, verificar se ele ainda está ativo
      try {
        const pixQrCode = await abacatePay.pixQrCode.check({
          id: userSubscription.abacatePayBillingId,
        });

        if (pixQrCode.error) {
          console.error(
            "Erro ao verificar PixQRCode na AbacatePay:",
            pixQrCode.error,
          );
          // Se houver um erro ao verificar o PixQRCode, criar um novo
        } else if (
          "data" in pixQrCode &&
          pixQrCode.data &&
          (pixQrCode.data.status === "PAID" ||
            pixQrCode.data.status === "EXPIRED")
        ) {
          // Se o PixQRCode já foi pago ou expirou, criar um novo
          console.log(
            `PixQRCode ${userSubscription.abacatePayBillingId} já foi pago ou expirou, criando um novo.`,
          );
        } else if ("data" in pixQrCode && pixQrCode.data) {
          // Se o PixQRCode ainda estiver ativo, retornar os dados dele
          return { data: pixQrCode.data };
        }
      } catch (error) {
        console.error("Erro ao verificar PixQRCode:", error);
        // Se houver um erro ao verificar o PixQRCode, criar um novo
      }
    }

    const pixQrCodeData = {
      amount: 5000, // R$ 50,00 em centavos
      expiresIn: 60 * 5, // 5 minutos
      description: "Assinatura Mensal HUB-LN",
      customer: {
        name: existingUser.name,
        cellphone: existingUser.cellphone,
        email: existingUser.email,
        taxId: existingUser.cpf || existingUser.cnpj || undefined,
      },
    };

    const pixQrCodeResponse = await abacatePay.pixQrCode.create(pixQrCodeData);

    if (pixQrCodeResponse.error) {
      console.error(
        "Erro ao criar PixQRCode na AbacatePay:",
        pixQrCodeResponse,
      );
      return { error: "Erro ao criar PixQRCode na AbacatePay." };
    }

    if (!("data" in pixQrCodeResponse)) {
      return { error: "Erro ao criar PixQRCode na AbacatePay." };
    }

    // Atualizar ou criar a assinatura com o novo PixQRCodeId
    if (userSubscription) {
      await db
        .update(subscription)
        .set({
          abacatePayBillingId: pixQrCodeResponse.data.id,
          pixQrCodeCreatedAt: new Date(),
          status: "pending",
        })
        .where(eq(subscription.userId, userId));
    } else {
      await db.insert(subscription).values({
        userId,
        abacatePayBillingId: pixQrCodeResponse.data.id,
        pixQrCodeCreatedAt: new Date(),
        status: "pending",
      });
    }

    revalidatePath("/");

    return { data: pixQrCodeResponse.data };
  } catch (error) {
    console.error("Erro ao criar PixQRCode:", error);
    return { error: "Erro interno ao criar PixQRCode." };
  }
}
