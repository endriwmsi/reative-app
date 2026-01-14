"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  options?: { value: string; label: string }[];
  filterType?: "default" | "select" | "boolean" | "sort-only";
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  options,
  filterType = "default",
}: DataTableColumnHeaderProps<TData, TValue>) {
  const currentFilter = column.getFilterValue();
  const hasActiveFilter = currentFilter !== undefined && currentFilter !== "";
  const canSort = column.getCanSort();

  // Se não pode ordenar e não tem filtros, renderiza apenas o título
  if (!canSort && filterType === "sort-only") {
    return <div className={cn(className)}>{title}</div>;
  }

  // Função para renderizar filtros por tipo
  const renderFilterOptions = () => {
    if (!options || filterType === "sort-only") return null;

    return (
      <>
        <DropdownMenuItem
          onClick={() => column.setFilterValue("")}
          className={cn(!hasActiveFilter && "bg-accent")}
        >
          <div className="mr-2 h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
          Todos
        </DropdownMenuItem>

        {options.map((option) => {
          let isActive = false;

          // Determina se a opção está ativa baseada no tipo de filtro
          switch (filterType) {
            case "boolean":
              isActive = currentFilter === (option.value === "true");
              break;
            case "select":
            case "default":
              isActive = currentFilter === option.value;
              break;
          }

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                let filterValue: string | boolean;

                // Define o valor do filtro baseado no tipo
                switch (filterType) {
                  case "boolean":
                    filterValue = option.value === "true";
                    break;
                  case "select":
                  case "default":
                  default:
                    filterValue = option.value;
                    break;
                }

                column.setFilterValue(filterValue);
              }}
              className={cn(isActive && "bg-accent")}
            >
              <div
                className={cn(
                  "mr-2 h-3.5 w-3.5 rounded-full",
                  isActive
                    ? "bg-blue-600"
                    : "border border-muted-foreground/30",
                )}
              />
              {option.label}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
      </>
    );
  };

  // Função para renderizar opções de ordenação
  const renderSortOptions = () => {
    if (!canSort) return null;

    return (
      <>
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Crescente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Decrescente
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    );
  };

  // Determina o ícone do botão baseado no estado
  const getButtonIcon = () => {
    if (canSort) {
      if (column.getIsSorted() === "desc") {
        return <ArrowDown className="ml-2 h-4 w-4" />;
      } else if (column.getIsSorted() === "asc") {
        return <ArrowUp className="ml-2 h-4 w-4" />;
      }
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "-ml-3 h-8 data-[state=open]:bg-accent",
              hasActiveFilter && "text-blue-600 font-medium",
            )}
          >
            <span>{title}</span>

            {/* Indicador visual de filtro ativo */}
            {hasActiveFilter && (
              <div className="ml-1 h-2 w-2 bg-blue-600 rounded-full" />
            )}

            {/* Ícone de ordenação ou filtro */}
            {getButtonIcon()}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          {/* Renderiza filtros se disponíveis */}
          {renderFilterOptions()}

          {/* Renderiza opções de ordenação se disponíveis */}
          {renderSortOptions()}

          {/* Opção de ocultar coluna */}
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ocultar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
