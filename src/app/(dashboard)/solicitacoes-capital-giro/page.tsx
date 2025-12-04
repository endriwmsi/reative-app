import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getCapitalGiroSolicitations } from "@/actions/capital-giro/capital-giro.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import SolicitationsTable from "./_components/solicitations-table";

export const metadata: Metadata = {
  title: "Hub LN - Solicitações de Capital de Giro",
  description:
    "Visualise suas solicitações de capital de giro de forma fácil e rápida.",
};

const SolicitacoesCapitalGiroPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { data: solicitations } = await getCapitalGiroSolicitations();

  return (
    <div className="container mx-auto p-2 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Solicitações de Capital de Giro
          </h1>
          <p className="text-muted-foreground">
            {session?.user.role === "admin"
              ? "Gerencie todas as solicitações de capital de giro."
              : "Visualize suas solicitações de capital de giro."}
          </p>
        </div>

        <Button className="gap-2 mt-4 sm:mt-0 w-full sm:w-auto" asChild>
          <Link href="/solicitacoes-capital-giro/nova-solicitacao">
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      <SolicitationsTable
        solicitations={solicitations || []}
        isAdmin={session?.user?.role === "admin"}
      />
    </div>
  );
};

export default SolicitacoesCapitalGiroPage;
