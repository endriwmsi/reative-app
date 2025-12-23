"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  useGlobalFilter?: boolean;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Filtrar...",
  useGlobalFilter = false,
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter;

  return (
    <div className="flex gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {(searchKey || useGlobalFilter) && (
          <Input
            placeholder={searchPlaceholder}
            value={
              useGlobalFilter
                ? ((table.getState().globalFilter as string) ?? "")
                : searchKey
                  ? ((table.getColumn(searchKey)?.getFilterValue() as string) ??
                    "")
                  : ""
            }
            onChange={(event) => {
              if (useGlobalFilter) {
                table.setGlobalFilter(event.target.value);
              } else if (searchKey) {
                table.getColumn(searchKey)?.setFilterValue(event.target.value);
              }
            }}
            className="h-8 w-full sm:w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="secondary"
            onClick={() => {
              table.resetColumnFilters();
              if (useGlobalFilter) {
                table.setGlobalFilter("");
              }
            }}
            className="h-8 w-full px-2 sm:w-auto lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
