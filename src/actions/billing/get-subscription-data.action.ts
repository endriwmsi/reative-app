// src/app/actions/get-subscription-data.ts
"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";

// Defina um tipo para o status da assinatura
export type SubscriptionStatus =
  | "active"
  | "trial"
  | "expired"
  | "none"
  | "pending";

// Defina um tipo para os dados da assinatura
export interface SubscriptionData {
  status: SubscriptionStatus;
  planName: string;
  price: number;
  startDate: string | null;
  renewalDate: string | null;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  daysLeft?: number;
}

export async function getSubscriptionData(
  userId: string,
): Promise<SubscriptionData> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  try {
    const sub = await db
      .select({
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialStartDate: subscription.startDate, // Assuming trial start is same as start date for now, or add to schema if needed
        trialExpiresAt: subscription.trialExpiresAt,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId));

    if (sub.length > 0) {
      const subscriptionData = sub[0];

      let status = subscriptionData.status as SubscriptionStatus;
      const now = new Date();

      // Handle pending with valid trial
      if (
        status === "pending" &&
        subscriptionData.trialExpiresAt &&
        new Date(subscriptionData.trialExpiresAt) > now
      ) {
        status = "trial";
      }

      // Check for expiration
      if (
        status === "active" &&
        subscriptionData.endDate &&
        new Date(subscriptionData.endDate) < now
      ) {
        status = "expired";
      }

      if (
        status === "trial" &&
        subscriptionData.trialExpiresAt &&
        new Date(subscriptionData.trialExpiresAt) < now
      ) {
        status = "expired";
      }

      // Calcule os dias restantes do trial
      let daysLeft: number | undefined;
      if (status === "trial" && subscriptionData.trialExpiresAt) {
        const trialEnd = new Date(subscriptionData.trialExpiresAt);
        const timeLeft = trialEnd.getTime() - now.getTime();
        daysLeft = Math.ceil(timeLeft / (1000 * 3600 * 24));
      }

      // Determine plan name based on status
      let planName = "Plano PRO";
      if (status === "trial") {
        planName = "Plano PRO (Trial)";
      } else if (status === "active") {
        planName = "Plano PRO Mensal";
      } else if (status === "pending") {
        planName = "Plano PRO (Pendente)";
      }

      // Defina os dados da assinatura
      return {
        status: status,
        planName: planName,
        price: 50, // Defina o preço do plano
        startDate: subscriptionData.startDate?.toISOString() ?? null,
        renewalDate: subscriptionData.endDate?.toISOString() ?? null,
        trialStartDate: subscriptionData.startDate?.toISOString() ?? null,
        trialEndDate: subscriptionData.trialExpiresAt?.toISOString() ?? null,
        daysLeft: daysLeft,
      };
    } else {
      // Se não houver assinatura, defina o status como "none"
      return {
        status: "none",
        planName: "Gratuito",
        price: 0,
        startDate: null,
        renewalDate: null,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar dados da assinatura:", error);
    // Lide com o erro aqui
    return {
      status: "none",
      planName: "Erro ao carregar",
      price: 0,
      startDate: null,
      renewalDate: null,
    };
  }
}
