"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteMultipleClients,
  updateMultipleClientsStatus,
} from "@/actions/submission/submission-bulk.action";
import {
  deleteSubmissionClient,
  updateClientStatus,
} from "@/actions/submission/submission-client.action";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCNPJ, formatCPF, formatDate } from "@/lib/utils";

type ClientData = {
  id: string;
  name: string;
  document: string;
  status: string;
  createdAt: Date;
  submissionId: string;
  isPaid: boolean;
};

interface ClientsTableProps {
  clients: ClientData[];
  userId: string;
  isAdmin: boolean;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    // Status iniciais (pré-pagamento)
    case "pendente":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "processando":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "aprovado":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "rejeitado":
      return "bg-red-100 text-red-800 hover:bg-red-200";

    // Status pós-pagamento (processo jurídico)
    case "deferido":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
    case "indeferido":
      return "bg-rose-100 text-rose-800 hover:bg-rose-200";
    case "em_analise":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "finalizado":
      return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    case "cancelado":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";

    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

export default function ClientsTable({
  clients,
  userId,
  isAdmin,
}: ClientsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleDeleteClick = (client: ClientData) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Admin pode selecionar todos, outros usuários apenas não pagos
      const selectableIds = isAdmin
        ? clients.map((client) => client.id)
        : clients.filter((client) => !client.isPaid).map((client) => client.id);
      setSelectedIds(selectableIds);
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

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteMultipleClients(selectedIds, userId, isAdmin);

      if (result.success) {
        toast.success(result.message || "Clientes removidos com sucesso");
        setSelectedIds([]);
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao remover clientes");
      }
    } catch {
      toast.error("Erro ao remover clientes");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleUpdateStatus = async (clientId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const result = await updateClientStatus(
        clientId,
        newStatus,
        userId,
        isAdmin,
      );

      if (result.success) {
        toast.success("Status atualizado com sucesso");
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao atualizar status");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedIds.length === 0) return;

    setIsUpdatingStatus(true);
    try {
      const result = await updateMultipleClientsStatus(
        selectedIds,
        newStatus,
        userId,
        isAdmin,
      );

      if (result.success) {
        toast.success(result.message || "Status atualizado com sucesso");
        setSelectedIds([]);
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao atualizar status");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteSubmissionClient(
        clientToDelete.id,
        userId,
        isAdmin,
      );

      if (result.success) {
        toast.success("Cliente removido com sucesso");
        // Recarregar a página para atualizar a lista
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao remover cliente");
      }
    } catch {
      toast.error("Erro ao remover cliente");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const columns: ColumnDef<ClientData>[] = [
    {
      id: "select",
      header: () => {
        // Admin pode selecionar todos, outros usuários apenas não pagos
        const selectableClients = isAdmin
          ? clients
          : clients.filter((client) => !client.isPaid);

        const allSelectableSelected =
          selectableClients.length > 0 &&
          selectableClients.every((client) => selectedIds.includes(client.id));

        return (
          <Checkbox
            checked={allSelectableSelected}
            onCheckedChange={handleSelectAll}
            disabled={selectableClients.length === 0}
            aria-label="Selecionar todos"
          />
        );
      },
      cell: ({ row }) => {
        const client = row.original;
        return (
          <Checkbox
            checked={selectedIds.includes(client.id)}
            onCheckedChange={(checked) =>
              handleSelectItem(client.id, checked as boolean)
            }
            disabled={!isAdmin && client.isPaid}
            aria-label="Selecionar item"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cliente" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "document",
      header: "Documento",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="text-sm">
            {client.document.length === 18 ? (
              <div>{formatCNPJ(client.document)}</div>
            ) : (
              <div>{formatCPF(client.document)}</div>
            )}
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
        const client = row.original;
        const status = row.getValue("status") as string;

        if (isAdmin) {
          // Admin pode sempre alterar status, mas com opções diferentes baseadas no pagamento
          const statusOptions = client.isPaid
            ? [
                // Opções pós-pagamento (processo jurídico/análise)
                { value: "aprovado", label: "Aprovado" },
                { value: "rejeitado", label: "Rejeitado" },
                { value: "deferido", label: "Deferido" },
                { value: "indeferido", label: "Indeferido" },
                { value: "em_analise", label: "Em Análise" },
                { value: "finalizado", label: "Finalizado" },
                { value: "cancelado", label: "Cancelado" },
                // Manter opções anteriores para compatibilidade
                { value: "pendente", label: "Pendente" },
                { value: "processando", label: "Processando" },
              ]
            : [
                // Opções pré-pagamento (processo inicial)
                { value: "pendente", label: "Pendente" },
                { value: "processando", label: "Processando" },
                { value: "aprovado", label: "Aprovado" },
                { value: "rejeitado", label: "Rejeitado" },
              ];

          return (
            <Select
              value={status}
              onValueChange={(newStatus) =>
                handleUpdateStatus(client.id, newStatus)
              }
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return <Badge className={getStatusColor(status)}>{status}</Badge>;
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
        const client = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  {client.isPaid ? (
                    // Opções pós-pagamento
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "deferido")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Marcar como Deferido
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "indeferido")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Marcar como Indeferido
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "em_analise")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Marcar como Em Análise
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "finalizado")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Marcar como Finalizado
                      </DropdownMenuItem>
                    </>
                  ) : (
                    // Opções pré-pagamento
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "aprovado")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Aprovar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "rejeitado")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rejeitar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateStatus(client.id, "processando")
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Marcar como Processando
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
              {!client.isPaid && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(client)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </DropdownMenuItem>
                </>
              )}
              {client.isPaid && (
                <DropdownMenuItem disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Não é possível remover (envio pago)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedIds.length} cliente(s) selecionado(s)
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Select
                    onValueChange={handleBulkUpdateStatus}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Atualizar status" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Status pré-pagamento */}
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="processando">Processando</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>

                      {/* Status pós-pagamento */}
                      <SelectItem value="deferido">Deferido</SelectItem>
                      <SelectItem value="indeferido">Indeferido</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Removendo..." : "Remover Selecionados"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={clients}
        searchKey="name"
        searchPlaceholder="Buscar por nome do cliente..."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o cliente{" "}
              <strong>{clientToDelete?.name}</strong>?
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
              {isDeleting ? "Removendo..." : "Remover Cliente"}
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
              <strong>{selectedIds.length}</strong> cliente(s) selecionado(s)?
              <br />
              Esta ação não pode ser desfeita e só afetará clientes de envios
              não pagos.
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
              {isDeleting ? "Removendo..." : "Remover Clientes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
