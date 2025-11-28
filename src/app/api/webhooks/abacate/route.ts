import { updateSubscriptionToActive } from "@/actions/billing/update-subscription.action";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = req.headers.get("x-webhook-secret") as string;

  const expectedSignature = process.env.ABACATEPAY_WEBHOOK_SECRET;

  if (signature !== expectedSignature) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.event) {
      case "billing.paid": {
        await updateSubscriptionToActive(event.data.pixQrCode.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return new Response("Webhook handler failed", { status: 400 });
  }
}
