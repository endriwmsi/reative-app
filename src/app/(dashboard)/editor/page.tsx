import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubscriptionData } from "@/actions/billing/get-subscription-data.action";
import { auth } from "@/auth";
import { ImageEditor } from "./_components/image-editor";

export const metadata: Metadata = {
  title: "Hub LN - Editor de Criativos",
  description: "Crie e edite seus criativos para Instagram.",
};

export default async function EditorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return redirect("/login");

  const subscriptionData = await getSubscriptionData(session.user.id);
  const hasAccess =
    session.user.role === "admin" || subscriptionData.status === "active";

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Você precisa de uma assinatura ativa para acessar o editor de
          criativos.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 lg:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Editor de Criativos
        </h1>
        <p className="text-muted-foreground">
          Crie imagens personalizadas para suas redes sociais.
        </p>
      </div>
      <ImageEditor />
    </div>
  );
}
