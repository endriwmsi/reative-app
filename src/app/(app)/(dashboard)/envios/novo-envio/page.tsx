import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSelectableCleanNameActions } from "@/actions/clean-name-action/clean-name-action.action";
import { getProductsForUser } from "@/actions/product/product.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import "@/types/auth";
import type { Metadata } from "next";
import NewSubmissionPage from "../_components/new-submission-page";

export const metadata: Metadata = {
  title: "Novo Envio",
  description: "Crie um novo envio de clientes",
};

export default async function NovoEnvioPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Buscar produtos disponíveis para o usuário
  const productsResult = await getProductsForUser(session.user.id);
  const activeActionsResult = await getSelectableCleanNameActions();
  const activeActions =
    activeActionsResult.success && activeActionsResult.data
      ? activeActionsResult.data
      : [];

  if (!productsResult.success || !productsResult.data) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/envios">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Novo Envio</h1>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Erro ao carregar produtos:{" "}
            {productsResult.error || "Tente novamente mais tarde"}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/envios">Voltar para Envios</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NewSubmissionPage
      products={productsResult.data}
      userId={session.user.id}
      activeActions={activeActions}
    />
  );
}
