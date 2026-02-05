"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import type { SubmissionClientWithUser } from "@/actions/submission/submission-client-admin.action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ClientActions } from "./client-actions";
import { ClientStatusBadge } from "./client-status-badge";

interface ClientsDataTableProps {
  data: SubmissionClientWithUser[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllCurrentPage: (checked: boolean) => void;
  allCurrentPageSelected: boolean;
  someCurrentPageSelected: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export function ClientsDataTable({
  data,
  selectedIds,
  onToggleSelection,
  onToggleAllCurrentPage,
  allCurrentPageSelected,
  someCurrentPageSelected,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: ClientsDataTableProps) {
  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "overflow-x-auto rounded-md border",
          isLoading && "opacity-60",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allCurrentPageSelected}
                  ref={(el) => {
                    if (el) {
                      (
                        el as HTMLButtonElement & { indeterminate: boolean }
                      ).indeterminate =
                        someCurrentPageSelected && !allCurrentPageSelected;
                    }
                  }}
                  onCheckedChange={(checked) => {
                    onToggleAllCurrentPage(checked === true);
                  }}
                  aria-label="Selecionar todos da página"
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((client) => (
                <TableRow
                  key={client.id}
                  data-state={selectedIds.has(client.id) && "selected"}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(client.id)}
                      onCheckedChange={() => onToggleSelection(client.id)}
                      aria-label={`Selecionar ${client.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {client.document}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{client.userName || "—"}</div>
                    <div className="text-muted-foreground text-xs">
                      {client.userEmail}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(client.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <ClientActions client={client} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      {/* Paginação */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <div className="flex-1 text-sm text-muted-foreground text-center lg:text-left">
          Mostrando {startItem} a {endItem} de {totalCount} resultado(s)
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:space-x-6 xl:space-x-8">
          <div className="flex items-center justify-center space-x-2 lg:justify-start">
            <p className="text-sm font-medium">Linhas por página</p>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100, 250].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-sm font-medium lg:w-[100px]">
            Página {currentPage} de {totalPages || 1}
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(1)}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Ir para primeira página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Ir para página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canNextPage}
            >
              <span className="sr-only">Ir para próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(totalPages)}
              disabled={!canNextPage}
            >
              <span className="sr-only">Ir para última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
