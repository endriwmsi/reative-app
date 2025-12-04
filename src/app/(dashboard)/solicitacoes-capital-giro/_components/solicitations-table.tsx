"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteCapitalGiro,
  updateCapitalGiroStatus,
} from "@/actions/capital-giro/capital-giro.action";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface CapitalGiro {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  estadoCivil: string;
  cpf: string;
  enderecoPessoa: string;
  cidadePessoa: string;
  estadoPessoa: string;
  razaoSocial: string;
  cnpj: string;
  faturamento: string;
  enderecoEmpresa: string;
  cidadeEmpresa: string;
  estadoEmpresa: string;
  temRestricao: string;
  valorRestricao?: string | null;
  status: "pending" | "analyzing" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

interface SolicitationsTableProps {
  solicitations: CapitalGiro[];
  isAdmin: boolean;
}

const statusMap = {
  pending: { label: "Pendente", color: "bg-yellow-500 hover:bg-yellow-600" },
  analyzing: { label: "Em Análise", color: "bg-blue-500 hover:bg-blue-600" },
  approved: { label: "Aprovado", color: "bg-green-500 hover:bg-green-600" },
  rejected: { label: "Rejeitado", color: "bg-red-500 hover:bg-red-600" },
};

const customGlobalFilter = (
  row: Row<CapitalGiro>,
  _columnId: string,
  filterValue: string,
) => {
  const item = row.original;
  const searchValue = filterValue.toLowerCase();

  return (
    item.name.toLowerCase().includes(searchValue) ||
    item.email.toLowerCase().includes(searchValue) ||
    item.cpf.includes(searchValue) ||
    (item.cnpj?.includes(searchValue) ?? false)
  );
};

export default function SolicitationsTable({
  solicitations,
  isAdmin,
}: SolicitationsTableProps) {
  const [solicitationToDelete, setSolicitationToDelete] =
    useState<CapitalGiro | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDeleteClick = (solicitation: CapitalGiro) => {
    setSolicitationToDelete(solicitation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!solicitationToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCapitalGiro(solicitationToDelete.id);
      if (result.success) {
        toast.success("Solicitação removida com sucesso!");
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.error || "Erro ao remover solicitação.");
      }
    } catch {
      toast.error("Erro ao remover solicitação.");
    } finally {
      setIsDeleting(false);
      setSolicitationToDelete(null);
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: CapitalGiro["status"],
  ) => {
    setIsUpdating(true);
    try {
      const result = await updateCapitalGiroStatus(id, newStatus);
      if (result.success) {
        toast.success(`Status atualizado para ${statusMap[newStatus].label}`);
      } else {
        toast.error(result.error || "Erro ao atualizar status.");
      }
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: ColumnDef<CapitalGiro>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "cpf",
      header: "Documento",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>CPF: {row.original.cpf}</span>
          {row.original.cnpj && (
            <span className="text-xs text-muted-foreground">
              CNPJ: {row.original.cnpj}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "faturamento",
      header: "Faturamento",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.faturamento}</div>
      ),
    },
    {
      accessorKey: "temRestricao",
      header: "Restrição",
      cell: ({ row }) => {
        const temRestricao = row.original.temRestricao === "sim";
        return (
          <div className="flex flex-col">
            <Badge variant={temRestricao ? "destructive" : "outline"}>
              {temRestricao ? "Sim" : "Não"}
            </Badge>
            {temRestricao && row.original.valorRestricao && (
              <span className="text-xs mt-1">
                {formatCurrency(parseFloat(row.original.valorRestricao))}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusMap[status] || {
          label: status,
          color: "bg-gray-500",
        };
        return (
          <Badge className={cn("text-white", config.color)}>
            {config.label}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const solicitation = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(solicitation.id)}
              >
                Copiar ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {isAdmin && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isUpdating}>
                    Alterar Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={solicitation.status}
                      onValueChange={(value) =>
                        handleStatusChange(
                          solicitation.id,
                          value as CapitalGiro["status"],
                        )
                      }
                    >
                      {Object.entries(statusMap).map(([key, { label }]) => (
                        <DropdownMenuRadioItem key={key} value={key}>
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(solicitation)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (solicitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma solicitação encontrada</CardTitle>
          <CardDescription>
            Não há solicitações de capital de giro para exibir no momento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Solicitações Recentes</CardTitle>
          <CardDescription>
            Gerencie as solicitações de capital de giro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={solicitations}
            globalFilterFn={customGlobalFilter}
            searchPlaceholder="Buscar por nome, email ou documento..."
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a solicitação de{" "}
              <strong>{solicitationToDelete?.name}</strong>?
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
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
