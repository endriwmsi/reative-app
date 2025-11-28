"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";

export async function updateSubscriptionToActive(billingId: string) {
  try {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 3600 * 1000); // Data de início + 30 dias

    await db
      .update(subscription)
      .set({
        status: "active",
        startDate: startDate,
        endDate: endDate,
      })
      .where(eq(subscription.abacatePayBillingId, billingId));

    revalidatePath("/configuracoes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar assinatura para ativa:", error);
    return { success: false, error };
  }
}

export async function updateSubscriptionToExpired(billingId: string) {
  try {
    await db
      .update(subscription)
      .set({ status: "expired" })
      .where(eq(subscription.abacatePayBillingId, billingId));

    revalidatePath("/configuracoes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar assinatura para expirada:", error);
    return { success: false, error };
  }
}
