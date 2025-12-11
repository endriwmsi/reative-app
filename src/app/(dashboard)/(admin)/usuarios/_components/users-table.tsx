"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, MoreHorizontal, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  approveUserAccount,
  rejectUserAccount,
  type User,
} from "@/actions/user/user-management.action";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserTableProps {
  users: User[];
}

export function UsersTable({ users }: UserTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleApproveUser = async (userId: string) => {
    setIsLoading(userId);
    try {
      const result = await approveUserAccount(userId);
      if (result.success) {
        toast.success(result.message || "Usuário aprovado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao aprovar usuário");
      }
    } catch {
      toast.error("Erro inesperado ao aprovar usuário");
    } finally {
      setIsLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setIsLoading(userId);
    try {
      const result = await rejectUserAccount(userId);
      if (result.success) {
        toast.success(result.message || "Usuário rejeitado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao rejeitar usuário");
      }
    } catch {
      toast.error("Erro inesperado ao rejeitar usuário");
    } finally {
      setIsLoading(null);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        return (
          <div className="max-w-[200px] truncate font-mono text-sm">
            {row.getValue("email")}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Telefone" />
      ),
      cell: ({ row }) => {
        return <div className="font-mono text-sm">{row.getValue("phone")}</div>;
      },
    },
    {
      accessorKey: "cpf",
      header: "CPF",
      cell: ({ row }) => {
        const cpf = row.getValue("cpf") as string | null;
        return <div className="font-mono text-sm">{cpf || "N/A"}</div>;
      },
    },
    {
      accessorKey: "cnpj",
      header: "CNPJ",
      cell: ({ row }) => {
        const cnpj = row.getValue("cnpj") as string | null;
        return <div className="font-mono text-sm">{cnpj || "N/A"}</div>;
      },
    },
    {
      accessorKey: "referredByEmail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Indicado por" />
      ),
      cell: ({ row }) => {
        const email = row.getValue("referredByEmail") as string | null;
        return (
          <div className="max-w-[200px] truncate font-mono text-sm">
            {email || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isVerified = row.getValue("emailVerified") as boolean;
        return (
          <Badge variant={isVerified ? "default" : "secondary"}>
            {isVerified ? "Aprovado" : "Pendente"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isAdmin",
      header: "Tipo",
      cell: ({ row }) => {
        const isAdmin = row.getValue("isAdmin") as boolean;
        return (
          <Badge variant={isAdmin ? "destructive" : "outline"}>
            {isAdmin ? "Admin" : "Usuário"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criado em" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const user = row.original;
        const loadingThisUser = isLoading === user.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={loadingThisUser}
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              {!user.emailVerified ? (
                <DropdownMenuItem
                  onClick={() => handleApproveUser(user.id)}
                  disabled={loadingThisUser}
                  className="text-green-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aprovar Conta
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleRejectUser(user.id)}
                  disabled={loadingThisUser}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Rejeitar Conta
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      searchPlaceholder="Filtrar por email, nome ou indicador..."
      globalFilterFn="includesString"
    />
  );
}
