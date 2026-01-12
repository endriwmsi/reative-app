"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn, formatDate } from "@/lib/utils";
import { DownloadSolicitationsButton } from "./download-solicitations-button";

interface CapitalGiro {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  estadoCivil: string;
  cpf: string;
  estadoNascimento: string;
  enderecoPessoa: string;
  cidadePessoa: string;
  estadoPessoa: string;
  nomePartner: string;
  documentoUrl?: string | null;
  razaoSocial: string;
  cnpj: string;
  faturamento: string;
  enderecoEmpresa: string;
  cidadeEmpresa: string;
  estadoEmpresa: string;
  temRestricao: string;
  valorRestricao?: string | null;
  status: "pending" | "analyzing" | "approved" | "rejected";
  isDownloaded: boolean;
  downloadedAt?: Date | null;
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
    item.nomePartner.toLowerCase().includes(searchValue) ||
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleDeleteClick = (solicitation: CapitalGiro) => {
    setSolicitationToDelete(solicitation);
    setDeleteDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = solicitations.map((s) => s.id);
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

  const handleConfirmDelete = async () => {
    if (!solicitationToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCapitalGiro(solicitationToDelete.id);
      if (result.success) {
        toast.success("Solicitação removida com sucesso!");
        setDeleteDialogOpen(false);
        setSelectedIds((prev) =>
          prev.filter((id) => id !== solicitationToDelete.id),
        );
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
      id: "select",
      header: () => {
        const allSelected =
          solicitations.length > 0 &&
          solicitations.every((s) => selectedIds.includes(s.id));

        return (
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={solicitations.length === 0}
            aria-label="Selecionar todos"
          />
        );
      },
      cell: ({ row }) => {
        const solicitation = row.original;
        return (
          <Checkbox
            checked={selectedIds.includes(solicitation.id)}
            onCheckedChange={(checked) =>
              handleSelectItem(solicitation.id, checked as boolean)
            }
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
      accessorKey: "nomePartner",
      header: "Parceiro",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-blue-600">
          {row.original.nomePartner}
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
          <span className="text-xs text-muted-foreground">
            Nascimento: {row.original.estadoNascimento}
          </span>
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
                {row.original.valorRestricao}
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
    ...(isAdmin
      ? [
          {
            accessorKey: "isDownloaded",
            header: ({ column }) => (
              <DataTableColumnHeader
                className="text-center justify-center"
                column={column}
                title="Exportado"
                options={[
                  { value: "true", label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
                filterType="boolean"
              />
            ),
            cell: ({ row }) => {
              const isDownloaded = row.original.isDownloaded;
              return (
                <div className="flex justify-center items-center">
                  <Badge
                    variant={isDownloaded ? "outline" : "secondary"}
                    className={cn(
                      "transition-all",
                      isDownloaded
                        ? "border-blue-500 text-blue-500 bg-blue-50"
                        : "text-muted-foreground",
                    )}
                  >
                    {isDownloaded ? "Sim" : "Não"}
                  </Badge>
                </div>
              );
            },
            filterFn: (row, id, value) => {
              const isDownloaded = row.getValue(id) as boolean;
              return isDownloaded === value;
            },
          } as ColumnDef<CapitalGiro>,
        ]
      : []),
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
          <div className="flex items-center gap-2">
            {/* Botão para visualizar documento */}
            {solicitation.documentoUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(solicitation.documentoUrl!, "_blank")
                }
                className="h-8 w-8 p-0"
                title="Visualizar Documento"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Visualizar Documento</span>
              </Button>
            )}

            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

                {solicitation.documentoUrl && (
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(solicitation.documentoUrl!, "_blank")
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Documento
                  </DropdownMenuItem>
                )}

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
          </div>
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Solicitações Recentes</CardTitle>
              <CardDescription>
                Gerencie as solicitações de capital de giro.
              </CardDescription>
            </div>

            {isAdmin && selectedIds.length > 0 && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedIds.length} item(s) selecionado(s)
                </div>
                <DownloadSolicitationsButton
                  selectedIds={selectedIds}
                  onSuccess={() => setSelectedIds([])}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={solicitations}
            globalFilterFn={customGlobalFilter}
            searchPlaceholder="Buscar por nome, email, parceiro ou documento..."
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
