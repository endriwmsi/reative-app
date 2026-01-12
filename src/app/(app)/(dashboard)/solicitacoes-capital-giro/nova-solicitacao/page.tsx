import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SolicitacaoForm from "../_components/solicitacao-form";

export const metadata: Metadata = {
  title: "Hub LN - Solicitações de Capital de Giro",
  description:
    "Visualise suas solicitações de capital de giro de forma fácil e rápida.",
};

const NovaSolicitacaoPage = () => {
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
            Escolha o tipo de envio que deseja criar
          </p>
        </div>
      </div>

      <SolicitacaoForm />
    </div>
  );
};

export default NovaSolicitacaoPage;
