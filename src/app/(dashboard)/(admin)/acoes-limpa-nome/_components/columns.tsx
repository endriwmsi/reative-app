"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteCleanNameAction } from "@/actions/clean-name-action/clean-name-action.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CleanNameAction } from "@/db/schema/clean-name-action";
import { CleanNameActionDialog } from "./clean-name-action-dialog";

export const columns: ColumnDef<CleanNameAction>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "startDate",
    header: "Início",
    cell: ({ row }) =>
      format(new Date(row.original.startDate), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: "endDate",
    header: "Fim",
    cell: ({ row }) =>
      format(new Date(row.original.endDate), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 items-start">
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Visível" : "Oculta"}
        </Badge>
        <Badge
          variant={row.original.allowSubmissions ? "outline" : "destructive"}
          className="whitespace-nowrap"
        >
          {row.original.allowSubmissions ? "Envios ON" : "Envios OFF"}
        </Badge>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const action = row.original;
      return (
        <div className="flex gap-2">
          <CleanNameActionDialog action={action}>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </CleanNameActionDialog>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              if (confirm("Tem certeza que deseja excluir?")) {
                const result = await deleteCleanNameAction(action.id);
                if (result.success) {
                  toast.success(result.message);
                } else {
                  toast.error(result.error);
                }
              }
            }}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      );
    },
  },
];
