"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { CreditCard, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteSubmission } from "@/actions/submission/submission.action";
import { deleteMultipleSubmissions } from "@/actions/submission/submission-bulk.action";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { PaymentModal } from "@/components/payment/asaas/payment-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayment } from "@/hooks/use-payment";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DownloadClientsButton } from "./download-clients-button";

interface SubmissionData {
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
}

interface SubmissionsTableProps {
  submissions: SubmissionData[];
  userId: string;
  isAdmin: boolean;
}

// Função de filtro personalizada para buscar por título, nome do usuário e email
const customGlobalFilter = (
  row: Row<SubmissionData>,
  _columnId: string,
  filterValue: string,
) => {
  const submission = row.original;
  const searchValue = filterValue.toLowerCase();

  return (
    submission.title.toLowerCase().includes(searchValue) ||
    submission.userName.toLowerCase().includes(searchValue) ||
    submission.userEmail.toLowerCase().includes(searchValue)
  );
};

export default function SubmissionsTable({
  submissions,
  userId,
  isAdmin,
}: SubmissionsTableProps) {
  const [submissionToDelete, setSubmissionToDelete] =
    useState<SubmissionData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    loading,
    paymentData,
    showPaymentModal,
    createPayment,
    closePaymentModal,
  } = usePayment();

  const handleDeleteClick = (submission: SubmissionData) => {
    setSubmissionToDelete(submission);
    setDeleteDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Selecionar todos os envios (pagos e não pagos) para permitir exportação
      const allIds = submissions.map((submission) => submission.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handlePayment = async () => {
    if (selectedIds.length === 0) return;

    // Filtrar apenas envios não pagos dos selecionados
    const unpaidSelectedIds = selectedIds.filter((id) => {
      const submission = submissions.find((s) => s.id === id);
      return submission && !submission.isPaid;
    });

    if (unpaidSelectedIds.length === 0) {
      toast.error("Nenhum envio não pago selecionado para pagamento.");
      return;
    }

    // Validar limite de envios por pagamento
    if (unpaidSelectedIds.length > 10) {
      toast.error(
        "Máximo de 10 envios por pagamento. Selecione menos envios não pagos.",
      );
      return;
    }

    await createPayment(unpaidSelectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    // Filtrar apenas envios não pagos dos selecionados
    const unpaidSelectedIds = selectedIds.filter((id) => {
      const submission = submissions.find((s) => s.id === id);
      return submission && !submission.isPaid;
    });

    if (unpaidSelectedIds.length === 0) {
      toast.error("Nenhum envio não pago selecionado para remoção.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteMultipleSubmissions(
        unpaidSelectedIds,
        userId,
        isAdmin,
      );

      if (result.success) {
        toast.success(result.message || "Envios removidos com sucesso");
        setSelectedIds([]);
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao remover envios");
      }
    } catch {
      toast.error("Erro ao remover envios");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!submissionToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteSubmission(
        submissionToDelete.id,
        userId,
        isAdmin,
      );

      if (result.success) {
        toast.success("Envio removido com sucesso");

        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao remover envio");
      }
    } catch {
      toast.error("Erro ao remover envio");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando":
        return "Aguardando";
      case "processando":
        return "Processando";
      case "em_analise_juridica":
        return "Em Análise Jurídica";
      case "parcialmente_concluido":
        return "Parcialmente Aprovado";
      case "concluido":
        return "Aprovado";
      case "finalizado":
        return "Finalizado";
      case "parcialmente_rejeitado":
        return "Parcialmente Rejeitado";
      case "rejeitado":
        return "Rejeitado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando":
      case "pending":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case "processando":
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "em_analise_juridica":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "parcialmente_concluido":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "concluido":
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "finalizado":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "parcialmente_rejeitado":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "rejeitado":
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum envio encontrado</CardTitle>
          <CardDescription>
            Não há envios para exibir. Crie seu primeiro envio clicando no botão
            "Novo Envio".
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const columns: ColumnDef<SubmissionData>[] = [
    {
      id: "select",
      header: () => {
        const allSelected =
          submissions.length > 0 &&
          submissions.every((submission) =>
            selectedIds.includes(submission.id),
          );

        return (
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={submissions.length === 0}
            aria-label="Selecionar todos"
          />
        );
      },
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <Checkbox
            checked={selectedIds.includes(submission.id)}
            onCheckedChange={(checked) =>
              handleSelectItem(submission.id, checked as boolean)
            }
            aria-label="Selecionar item"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Nome do envio",
      cell: ({ row }) => {
        const submission = row.original;
        return <div className="text-sm break-words">{submission.title}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "produto",
      header: "Produto",
      cell: ({ row }) => {
        const submission = row.original;
        return <div className="text-sm">{submission.productName}</div>;
      },
    },
    {
      accessorKey: "usuario",
      header: "Parceiro",
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <div className="text-sm flex flex-col space-y-1">
            <span className="font-medium break-words">
              {submission.userName}
            </span>
            <span className="text-primary/50 text-xs break-all">
              {submission.userEmail}
            </span>
            <span className="text-primary/50 text-xs">
              {submission.userPhone}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "quantidade",
      header: "Qtd.",
      cell: ({ row }) => {
        const submission = row.original;
        return <div className="text-sm text-center">{submission.quantity}</div>;
      },
    },
    {
      accessorKey: "valorUnitario",
      header: "Valor Unit.",
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <div className="text-sm">
            {formatCurrency(parseFloat(submission.unitPrice))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-center justify-center"
          column={column}
          title="Status"
          options={[
            { value: "aguardando", label: "Aguardando" },
            { value: "processando", label: "Processando" },
            { value: "em_analise_juridica", label: "Em Análise Jurídica" },
            { value: "parcialmente_concluido", label: "Parcialmente Aprovado" },
            { value: "concluido", label: "Aprovado" },
            { value: "finalizado", label: "Finalizado" },
            {
              value: "parcialmente_rejeitado",
              label: "Parcialmente Rejeitado",
            },
            { value: "rejeitado", label: "Rejeitado" },
          ]}
          filterType="select"
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as string;
        return status.toLowerCase() === value.toLowerCase();
      },
    },
    {
      accessorKey: "isPaid",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="text-center justify-center"
          column={column}
          title="Pagamento"
          options={[
            { value: "true", label: "Confirmado" },
            { value: "false", label: "Aguardando Pagamento" },
          ]}
          filterType="boolean"
        />
      ),
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <div className="flex justify-center items-center">
            <Badge
              variant={submission.isPaid ? "default" : "secondary"}
              className={cn(
                "transition-all",
                submission.isPaid ? "bg-green-500 hover:bg-green-300" : "",
              )}
            >
              {submission.isPaid ? "Confirmado" : "Pendente"}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const isPaid = row.getValue(id) as boolean;
        return isPaid === value;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title="Data"
          filterType="sort-only"
        />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(date)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/envios/${submission.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(submission)}
                  disabled={submission.isPaid}
                  className="text-red-600 focus:text-red-600 disabled:text-gray-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {submission.isPaid
                    ? "Não é possível remover (pago)"
                    : "Remover"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const selectedSubmissions = submissions.filter((submission) =>
    selectedIds.includes(submission.id),
  );

  const selectedUnpaidSubmissions = selectedSubmissions.filter(
    (submission) => !submission.isPaid,
  );

  const selectedTotal = selectedSubmissions.reduce(
    (total, submission) => total + parseFloat(submission.totalAmount),
    0,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Envios de Clientes</CardTitle>
              <CardDescription>
                {isAdmin
                  ? `${submissions.length} envio(s) encontrado(s) na plataforma.`
                  : `${submissions.length} envio(s) encontrado(s) (seus envios e de seus indicados).`}
              </CardDescription>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="text-sm text-muted-foreground">
                  {selectedIds.length} item(s) selecionado(s) - Total:{" "}
                  {formatCurrency(selectedTotal)}
                  {selectedUnpaidSubmissions.length !== selectedIds.length && (
                    <div className="text-blue-600 text-xs mt-1">
                      {selectedUnpaidSubmissions.length} não pago(s) de{" "}
                      {selectedIds.length} selecionado(s)
                    </div>
                  )}
                  {selectedUnpaidSubmissions.length > 10 && (
                    <div className="text-red-600 text-xs mt-1">
                      Máximo de 10 envios não pagos por pagamento
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-row lg:items-center lg:flex-shrink-0">
                  <DownloadClientsButton selectedSubmissionIds={selectedIds} />
                  <Button
                    onClick={handlePayment}
                    disabled={
                      loading ||
                      selectedUnpaidSubmissions.length > 10 ||
                      selectedUnpaidSubmissions.length === 0
                    }
                    className="flex items-center gap-2 w-full lg:w-auto"
                  >
                    <CreditCard className="h-4 w-4" />
                    {loading
                      ? "Processando..."
                      : selectedUnpaidSubmissions.length === 0
                        ? "Todos pagos"
                        : `Pagar ${selectedUnpaidSubmissions.length} não pago(s)`}
                  </Button>
                  {isAdmin && selectedUnpaidSubmissions.length > 0 && (
                    <Button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      variant="destructive"
                      className="flex items-center gap-2 w-full lg:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting
                        ? "Removendo..."
                        : `Remover ${selectedUnpaidSubmissions.length} não pago(s)`}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={submissions}
            globalFilterFn={customGlobalFilter}
            searchPlaceholder="Buscar por nome, email ou título..."
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o envio{" "}
              <strong>{submissionToDelete?.title}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Removendo..." : "Remover Envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{selectedUnpaidSubmissions.length}</strong> envio(s) não
              pago(s) selecionado(s)?
              <br />
              Esta ação não pode ser desfeita. Envios já pagos não serão
              afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Removendo..." : "Remover Envios"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Pagamento */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={closePaymentModal}
          paymentData={paymentData}
          onPaymentSuccess={() => {
            // Apenas fechar o modal e mostrar toast de sucesso
            // O hook usePaymentStatus já atualizou os dados via revalidatePath
            closePaymentModal();
            toast.success("Status de pagamento atualizado!", {
              description: "A tabela será atualizada automaticamente.",
            });

            // Recarregar apenas se necessário (como fallback)
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }}
        />
      )}
    </>
  );
}
