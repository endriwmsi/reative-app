"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteSubmission } from "@/actions/submission/submission.action";
import { deleteMultipleSubmissions } from "@/actions/submission/submission-bulk.action";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { PaymentModal } from "@/components/payment/payment-modal";
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
import { formatCurrency, formatDate } from "@/lib/utils";

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
      const unpaidIds = submissions
        .filter((submission) => !submission.isPaid)
        .map((submission) => submission.id);
      setSelectedIds(unpaidIds);
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

    // Validar limite de envios por pagamento
    if (selectedIds.length > 10) {
      toast.error("Máximo de 10 envios por pagamento. Selecione menos envios.");
      return;
    }

    await createPayment(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteMultipleSubmissions(
        selectedIds,
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
        const unpaidSubmissions = submissions.filter(
          (submission) => !submission.isPaid,
        );
        const allUnpaidSelected =
          unpaidSubmissions.length > 0 &&
          unpaidSubmissions.every((submission) =>
            selectedIds.includes(submission.id),
          );

        return (
          <Checkbox
            checked={allUnpaidSelected}
            onCheckedChange={handleSelectAll}
            disabled={unpaidSubmissions.length === 0}
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
            disabled={submission.isPaid}
            aria-label="Selecionar item"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      cell: ({ row }) => {
        const submission = row.original;
        return <div className="text-sm">{submission.title}</div>;
      },
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Usuário" />
      ),
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <div className="text-sm flex flex-col">
            <span>{submission.userName}</span>
            <span className="text-primary/50">{submission.userEmail}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "quantidade",
      header: "Quantidade",
      cell: ({ row }) => {
        const submission = row.original;
        return <div className="text-sm">{submission.quantity}</div>;
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
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isPaid",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Situação Pagamento" />
      ),
      cell: ({ row }) => {
        const submission = row.original;
        return (
          <Badge
            variant={submission.isPaid ? "default" : "secondary"}
            className={
              submission.isPaid ? "bg-green-500 hover:bg-green-600" : ""
            }
          >
            {submission.isPaid ? "Pago" : "Aguardando Pagamento"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
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

  const selectedTotal = submissions
    .filter((submission) => selectedIds.includes(submission.id))
    .reduce(
      (total, submission) => total + parseFloat(submission.totalAmount),
      0,
    );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Envios de Clientes</CardTitle>
              <CardDescription>
                {isAdmin
                  ? `${submissions.length} envio(s) encontrado(s) na plataforma.`
                  : `${submissions.length} envio(s) encontrado(s) (seus envios e de seus indicados).`}
              </CardDescription>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {selectedIds.length} item(s) selecionado(s) - Total:{" "}
                  {formatCurrency(selectedTotal)}
                  {selectedIds.length > 10 && (
                    <div className="text-red-600 text-xs mt-1">
                      Máximo de 10 envios por pagamento
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePayment}
                    disabled={loading || selectedIds.length > 10}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {loading
                      ? "Processando..."
                      : selectedIds.length > 10
                        ? "Muitos envios"
                        : "Pagar Selecionados"}
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Removendo..." : "Remover Selecionados"}
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
            searchKey="title"
            searchPlaceholder="Buscar por nome do cliente..."
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
              <strong>{selectedIds.length}</strong> envio(s) selecionado(s)?
              <br />
              Esta ação não pode ser desfeita e só afetará envios não pagos.
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
