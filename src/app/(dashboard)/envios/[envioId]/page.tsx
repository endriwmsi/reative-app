import {
  ArrowLeft,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { calculateCommissionChain } from "@/actions/commission/commission.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ClientsTable from "./_components/clients-table";
import "@/types/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { getSubmissionById } from "@/actions/submission/submission.action";
import { getSubmissionClients } from "@/actions/submission/submission-client.action";
import { formatCurrency, formatDate } from "@/lib/utils";

type SubmissionDetail = {
  id: string;
  title: string;
  totalAmount: string;
  unitPrice: string;
  quantity: number;
  status: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  productName: string;
  productCategory: string;
  userName: string;
  userEmail: string;
  userId?: string;
  productId?: number;
  notes?: string;
};

type ClientData = {
  id: string;
  submissionId: string;
  name: string;
  document: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isPaid: boolean;
};

interface EnvioDetailPageProps {
  params: {
    envioId: string;
  };
}

export const metadata: Metadata = {
  title: "Meus Envios",
  description: "Gerencie seus envios de forma fácil e rápida.",
};

export default async function EnvioDetailPage({
  params,
}: EnvioDetailPageProps) {
  const { envioId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isAdmin =
    Boolean((session.user as Record<string, unknown>).isAdmin) || false;

  if (Number.isNaN(envioId)) {
    redirect("/envios");
  }

  // Buscar dados do envio e clientes em paralelo
  const [submissionResult, clientsResult] = await Promise.all([
    getSubmissionById(envioId, session.user.id, isAdmin),
    getSubmissionClients(envioId, session.user.id, isAdmin),
  ]);

  if (!submissionResult.success || !submissionResult.data) {
    redirect("/envios");
  }

  const submission = submissionResult.data as SubmissionDetail;
  const clients = clientsResult.success
    ? (clientsResult.data as ClientData[])
    : [];

  // Calcular comissões para este envio
  let totalCommission = 0;
  let commissionData = null;

  if (submission.userId && submission.productId) {
    const commissionResult = await calculateCommissionChain({
      submissionId: envioId,
      buyerUserId: submission.userId,
      productId: submission.productId,
      quantity: submission.quantity,
      totalAmount: submission.totalAmount,
      unitPrice: submission.unitPrice,
    });

    if (commissionResult.success && commissionResult.data) {
      commissionData = commissionResult.data;
      totalCommission = commissionData.reduce(
        (total, item) => total + parseFloat(item.totalCommission),
        0,
      );
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <div className="flex flex-col">
          <Button asChild variant="secondary" size="icon">
            <Link href="/envios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{submission.title}</h1>
              <p className="text-muted-foreground">
                Criado em {formatDate(submission.createdAt)}
              </p>
            </div>
          </div>
        </div>
        {/* 
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(submission.status)}>
            {submission.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Unitário
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(submission.unitPrice)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(submission.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produto</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{submission.productName}</div>
            <div className="text-xs text-muted-foreground">
              {submission.productCategory}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comissão Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCommission)}
            </div>
            {commissionData && commissionData.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {commissionData.length} nível
                {commissionData.length > 1 ? "eis" : ""} de comissão
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Envio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Responsável
              </span>
              <p className="text-sm">{submission.userName}</p>
              <p className="text-xs text-muted-foreground">
                {submission.userEmail}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Última Atualização
              </span>
              <p className="text-sm">{formatDate(submission.updatedAt)}</p>
            </div>
          </div>

          {submission.notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Observações
                </span>
                <p className="text-sm mt-1">{submission.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Commission Details */}
      {isAdmin && commissionData && commissionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes das Comissões</CardTitle>
            <CardDescription>
              Distribuição das comissões por nível da rede de afiliados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionData.map((commission) => (
                <div
                  key={`${commission.level}-${commission.referralCode}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Nível {commission.level + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {commission.userName} ({commission.referralCode})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Preço base: {formatCurrency(commission.basePrice)} → Preço
                      de venda: {formatCurrency(commission.sellingPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(commission.totalCommission)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(commission.commissionPerUnit)} por unidade
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes do Envio ({clients.length})</CardTitle>
          <CardDescription>
            Lista de todos os clientes incluídos neste envio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsTable
            clients={clients}
            userId={session.user.id}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
