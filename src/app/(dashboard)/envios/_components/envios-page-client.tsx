"use client";

import { Clock, TrendingUp, Upload, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SubmissionsTableQuery from "./submissions-table-query";
import { CreateSubmissionDialog } from "./create-submission-dialog";
import { formatCurrency } from "@/lib/utils";
import { useSubmissions } from "@/hooks/use-submissions";

interface EnviosPageClientProps {
  userId: string;
  isAdmin: boolean;
  products: Array<{
    id: number;
    name: string;
    basePrice: string;
    customPrice?: string;
    description?: string;
    category: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  initialBalance: number;
}

export default function EnviosPageClient({
  userId,
  isAdmin,
  products,
  initialBalance,
}: EnviosPageClientProps) {
  const { data: submissions = [], isLoading } = useSubmissions({ userId, isAdmin });

  // Calcular estatísticas
  const totalSubmissions = submissions.length;
  const pendingSubmissions = submissions.filter(
    (sub) => sub.status === "pending" || sub.status === "processing"
  ).length;
  const paidSubmissions = submissions.filter((sub) => sub.isPaid).length;
  const totalRevenue = submissions
    .filter((sub) => sub.isPaid)
    .reduce((total, sub) => total + parseFloat(sub.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Envios</h1>
          <p className="text-muted-foreground">
            Gerencie seus envios de clientes e acompanhe o status dos pagamentos
          </p>
        </div>
        <CreateSubmissionDialog products={products} userId={userId} />
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  +{submissions.filter(sub => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(sub.createdAt) > weekAgo;
                  }).length} esta semana
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando pagamento
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{paidSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSubmissions > 0 
                    ? `${Math.round((paidSubmissions / totalSubmissions) * 100)}% do total`
                    : "Nenhum envio ainda"
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Revenue Total" : "Saldo Disponível"}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin ? formatCurrency(totalRevenue) : formatCurrency(initialBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "Valor total acumulado" : "Para saque"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de envios com React Query */}
      <SubmissionsTableQuery userId={userId} isAdmin={isAdmin} />
    </div>
  );
}