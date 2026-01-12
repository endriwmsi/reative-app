import { CrownIcon } from "lucide-react";
import type { Metadata } from "next";
import { SubscriptionView } from "@/app/(app)/(dashboard)/configuracoes/_components/subscription-view";

export const metadata: Metadata = {
  title: "Hub LN - Assinatura",
  description: "Gerencie seu plano e informações de pagamento.",
};

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div className="flex space-x-3 mb-6">
        <div className="bg-secondary p-3 rounded-md flex items-center justify-center">
          <CrownIcon className="h-6 w-6" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-md font-medium">Plano & Assinatura</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie seu plano e informações de pagamento.
          </p>
        </div>
      </div>
      <SubscriptionView />
    </div>
  );
}
