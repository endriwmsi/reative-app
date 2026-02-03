import { eq } from "drizzle-orm";
import { Clock, TrendingUp, Upload, Wallet } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAvailableBalance } from "@/actions/commission/commission-earnings.action";
import {
  getProductsForUser,
  getUserProducts,
} from "@/actions/product/product.action";
import { getUserSubmissions } from "@/actions/submission/submission.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db/client";
import { user } from "@/db/schema/user";
import SubmissionsTable from "./_components/submissions-table";
import "@/types/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type SubmissionData = {
  id: string;
  title: string;
  totalAmount: string;
  unitPrice: string;
  quantity: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  productName: string;
  productCategory: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  canViewClients?: boolean;
  isPaid: boolean;
  paymentDate?: Date | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
  isDownloaded: boolean;
  downloadedAt?: Date | null;
};

export const metadata: Metadata = {
  title: "Hub LN - Meus Envios",
  description: "Gerencie seus envios de forma fácil e rápida.",
};

export default async function EnviosPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const [userData] = await db
    .select({
      id: user.id,
      referredBy: user.referredBy,
    })
    .from(user)
    .where(eq(user.id, session.user.id));

  // Buscar envios, produtos e saldo em paralelo
  const [submissionsResult, productsResult, balanceResult] = await Promise.all([
    getUserSubmissions(session.user.id, session.user.role === "admin"),
    // Se o usuário foi indicado, usar preços personalizados do indicador
    userData?.referredBy
      ? getProductsForUser(session.user.id)
      : getUserProducts(session.user.id),
    // Buscar saldo disponível para comissões
    getAvailableBalance(session.user.id),
  ]);

  if (!submissionsResult.success || !submissionsResult.data) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar envios</h1>
          <p className="text-muted-foreground">
            {submissionsResult.error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  if (!productsResult.success || !productsResult.data) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar produtos</h1>
          <p className="text-muted-foreground">
            {productsResult.error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Envios de Clientes</h1>
          <p className="text-muted-foreground">
            {session.user.role === "admin"
              ? "Gerencie todos os envios de clientes da plataforma."
              : "Visualize seus envios e os envios dos seus indicados."}
          </p>
        </div>

        <Button className="gap-2 mt-4 sm:mt-0 w-full sm:w-auto" asChild>
          <Link href="/envios/novo-envio">
            <Upload className="h-4 w-4" />
            Novo envio
          </Link>
        </Button>
      </div>

      {/* Saldo de Comissões */}
      {balanceResult.success && balanceResult.data && (
        <div className="-mx-6 lg:mx-0">
          <div className="overflow-x-auto lg:overflow-x-visible px-6 lg:px-0">
            <div className="flex gap-4 lg:grid lg:grid-cols-3 lg:gap-4">
              <Card className="min-w-[280px] shrink-0 lg:min-w-0 lg:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Disponível para Retirada
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(balanceResult.data.availableBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Disponível para saque imediato
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-[280px] shrink-0 lg:min-w-0 lg:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Pendente
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(balanceResult.data.pendingBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando período de 7 dias
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-[280px] shrink-0 lg:min-w-0 lg:shrink">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Comissões
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      balanceResult.data.availableBalance +
                        balanceResult.data.pendingBalance,
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor total acumulado
                  </p>
                </CardContent>
              </Card>

              {/* Elemento invisível para criar espaço à direita em mobile */}
              <div className="w-2 shrink-0 lg:hidden" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-700 dark:text-yellow-500">
            ⚠️ AÇÃO NECESSÁRIA: Assine a Ficha Associativa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm md:text-base">
          <p>Precisamos da sua formalização imediata para validar o pedido.</p>

          <p className="font-semibold text-yellow-800 dark:text-yellow-400">
            🚨 ATENÇÃO: Lembramos que é obrigatória uma assinatura para CADA
            NOME (CPF ou CNPJ) enviado. Se você enviou mais de um nome, cada
            cliente deve assinar sua respectiva ficha.
          </p>

          <p>
            Acesse o link seguro da ZapSign e assine digitalmente agora para
            evitar atrasos na baixa: 👇{" "}
            <a
              href="https://app.zapsign.com.br/verificar/doc/098f6450-8581-4f3d-ba13-fd6c459f7df2"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              https://app.zapsign.com.br/verificar/doc/098f6450-8581-4f3d-ba13-fd6c459f7df2
            </a>
          </p>
        </CardContent>
      </Card> */}

      <SubmissionsTable
        submissions={submissionsResult.data as SubmissionData[]}
        userId={session.user.id}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
