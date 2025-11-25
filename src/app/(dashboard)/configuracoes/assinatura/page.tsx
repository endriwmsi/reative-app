import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Hub LN - Assinatura",
  description: "Gerencie seu plano e informações de pagamento.",
};

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Assinatura</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie seu plano e informações de pagamento.
        </p>
      </div>
      <Separator />
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Plano Atual</h4>
            <p className="text-sm text-muted-foreground">
              Você está no plano Gratuito.
            </p>
          </div>
          <Button variant="outline">Gerenciar Assinatura</Button>
        </div>
      </div>
    </div>
  );
}
