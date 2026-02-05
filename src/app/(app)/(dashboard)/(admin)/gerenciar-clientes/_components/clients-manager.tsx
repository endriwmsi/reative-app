"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubmissionClientStatus } from "@/db/schema";
import { useSubmissionClients } from "@/hooks/use-submission-clients";
import { BulkStatusDialog } from "./bulk-status-dialog";
import { ClientsDataTable } from "./clients-data-table";
import { ClientsToolbar } from "./clients-toolbar";

export function ClientsManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estado de seleção persistente (Set de IDs)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Parâmetros da URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const name = searchParams.get("name") || "";
  const document = searchParams.get("document") || "";
  const status =
    (searchParams.get("status") as SubmissionClientStatus) || undefined;

  // Query para buscar dados
  const {
    data: response,
    isLoading,
    isFetching,
  } = useSubmissionClients({
    page,
    pageSize,
    name: name || undefined,
    document: document || undefined,
    status,
  });

  // Função para atualizar URL params
  const updateSearchParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined || value === "" || value === null) {
            params.delete(key);
          } else {
            params.set(key, String(value));
          }
        }

        // Reset para página 1 quando filtros mudam (exceto quando mudando página)
        if (!("page" in updates)) {
          params.set("page", "1");
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  // Handlers para filtros
  const handleNameChange = useCallback(
    (value: string) => updateSearchParams({ name: value }),
    [updateSearchParams],
  );

  const handleDocumentChange = useCallback(
    (value: string) => updateSearchParams({ document: value }),
    [updateSearchParams],
  );

  const handleStatusChange = useCallback(
    (value: string) => updateSearchParams({ status: value }),
    [updateSearchParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => updateSearchParams({ page: newPage }),
    [updateSearchParams],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) =>
      updateSearchParams({ pageSize: newPageSize, page: 1 }),
    [updateSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  // Toggle seleção de um item
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle seleção de todos os itens da página atual
  const toggleAllCurrentPage = useCallback(
    (checked: boolean) => {
      if (!response?.data) return;

      const clients = response.data;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const client of clients) {
          if (checked) {
            next.add(client.id);
          } else {
            next.delete(client.id);
          }
        }
        return next;
      });
    },
    [response?.data],
  );

  // Limpar seleção
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Callback para quando bulk update for bem sucedido
  const handleBulkSuccess = useCallback(() => {
    setBulkDialogOpen(false);
    clearSelection();
  }, [clearSelection]);

  // Verificar se todos os itens da página atual estão selecionados
  const allCurrentPageSelected = useMemo(() => {
    if (!response?.data || response.data.length === 0) return false;
    return response.data.every((client) => selectedIds.has(client.id));
  }, [response?.data, selectedIds]);

  // Verificar se alguns (mas não todos) itens da página atual estão selecionados
  const someCurrentPageSelected = useMemo(() => {
    if (!response?.data || response.data.length === 0) return false;
    const selectedOnPage = response.data.filter((client) =>
      selectedIds.has(client.id),
    );
    return (
      selectedOnPage.length > 0 && selectedOnPage.length < response.data.length
    );
  }, [response?.data, selectedIds]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response?.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {response?.error || "Erro ao carregar clientes"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <ClientsToolbar
            name={name}
            document={document}
            status={status || ""}
            onNameChange={handleNameChange}
            onDocumentChange={handleDocumentChange}
            onStatusChange={handleStatusChange}
            onClearFilters={handleClearFilters}
            selectedCount={selectedIds.size}
            onBulkAction={() => setBulkDialogOpen(true)}
            isLoading={isFetching}
          />

          <ClientsDataTable
            data={response.data || []}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAllCurrentPage={toggleAllCurrentPage}
            allCurrentPageSelected={allCurrentPageSelected}
            someCurrentPageSelected={someCurrentPageSelected}
            currentPage={page}
            pageSize={pageSize}
            totalCount={response.totalCount || 0}
            totalPages={response.totalPages || 0}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isFetching}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {selectedIds.size > 0 && (
                <>
                  {selectedIds.size} cliente(s) selecionado(s)
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="ml-2 text-primary hover:underline"
                  >
                    Limpar seleção
                  </button>
                </>
              )}
            </span>
            <span>Total de clientes: {response.totalCount || 0}</span>
          </div>
        </CardContent>
      </Card>

      <BulkStatusDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedIds={Array.from(selectedIds)}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
