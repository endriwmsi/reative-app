import { Lock, Plus } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSubscriptionData } from "@/actions/billing/get-subscription-data.action";
import { getCapitalGiroSolicitations } from "@/actions/capital-giro/capital-giro.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  if (!session?.user) redirect("/login");

  const subscription = await getSubscriptionData(session.user.id);

  if (subscription.status !== "active") {
    return (
      <div className="container mx-auto p-2 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              Solicitações de Capital de Giro
            </h1>
            <p className="text-muted-foreground">
              Acesso restrito a assinantes ativos.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Funcionalidade Bloqueada</CardTitle>
            </div>
            <CardDescription>
              O acesso às solicitações de capital de giro está disponível apenas
              para assinantes com plano ativo.
              <br />
              Seu status atual:{" "}
              <span className="font-medium capitalize">
                {subscription.status === "trial"
                  ? "Período de Teste"
                  : subscription.status === "expired"
                    ? "Expirada"
                    : subscription.status}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/configuracoes/assinatura">Ativar Assinatura</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
