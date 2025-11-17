import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Endpoint para notificação de atualizações de pagamento em tempo real
 * Usado para comunicar mudanças de status via WebSocket ou polling
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        user: session.user.id,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("[NotifyAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Endpoint para trigger de revalidação manual
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, type = "manual" } = body;

    console.log(`[NotifyAPI] Manual revalidation triggered:`, {
      paymentId,
      type,
      userId: session.user.id,
    });

    // Resposta para trigger de refresh no frontend
    return NextResponse.json(
      {
        success: true,
        action: "refresh",
        paymentId,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("[NotifyAPI] Error in POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
