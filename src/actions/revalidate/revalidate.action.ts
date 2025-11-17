"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Server Action para forçar revalidação completa dos dados de envios
 * Usado após confirmação de pagamento via webhook
 */
export async function revalidateSubmissionsData() {
  console.log("[RevalidateSubmissions] Forcing data revalidation");

  try {
    // Revalidar todas as páginas relacionadas a envios
    revalidatePath("/dashboard");
    revalidatePath("/envios");
    revalidatePath("/dashboard/envios");
    revalidatePath("/(dashboard)/envios");

    // Revalidar tags específicas se estiver usando
    revalidateTag("submissions");
    revalidateTag("payments");
    revalidateTag("user-data");

    console.log("[RevalidateSubmissions] Revalidation completed successfully");
    return { success: true };
  } catch (error) {
    console.error("[RevalidateSubmissions] Error during revalidation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action para revalidar dados de um pagamento específico
 * Usado quando detectamos que um pagamento específico foi confirmado
 */
export async function revalidatePaymentData(paymentId: string) {
  console.log(
    `[RevalidatePayment] Forcing revalidation for payment ${paymentId}`,
  );

  try {
    // Revalidar páginas principais
    revalidatePath("/envios");
    revalidatePath("/dashboard");
    revalidatePath("/(dashboard)/envios");

    // Revalidar tags relacionadas ao pagamento
    revalidateTag(`payment-${paymentId}`);
    revalidateTag("submissions");
    revalidateTag("payments");

    console.log(
      `[RevalidatePayment] Revalidation completed for payment ${paymentId}`,
    );
    return { success: true, paymentId };
  } catch (error) {
    console.error(
      `[RevalidatePayment] Error revalidating payment ${paymentId}:`,
      error,
    );
    return {
      success: false,
      paymentId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
