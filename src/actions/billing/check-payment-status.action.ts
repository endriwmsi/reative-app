"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";

export async function checkPaymentStatusAction(userId: string) {
  try {
    const [sub] = await db
      .select({
        status: subscription.status,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId));

    if (!sub) {
      return { status: "none" };
    }

    return { status: sub.status };
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return { status: "error" };
  }
}
