import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import SolicitacaoForm from "../_components/solicitacao-form";

export const metadata: Metadata = {
  title: "Hub LN - Solicitações de Capital de Giro",
  description:
    "Visualise suas solicitações de capital de giro de forma fácil e rápida.",
};

const NovaSolicitacaoPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/solicitacoes-capital-giro">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Solicitação de Capital de Giro</h1>
          <p className="text-muted-foreground">
            Preencha os dados para solicitar capital de giro
          </p>
        </div>
      </div>

      <SolicitacaoForm
        userSession={{
          id: session.user.id,
          name: session.user.name,
        }}
      />
    </div>
  );
};

export default NovaSolicitacaoPage;
