"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use-debounce";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Processando" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "cancelled", label: "Cancelado" },
];

interface ClientsToolbarProps {
  name: string;
  document: string;
  status: string;
  onNameChange: (value: string) => void;
  onDocumentChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  selectedCount: number;
  onBulkAction: () => void;
  isLoading?: boolean;
}

export function ClientsToolbar({
  name,
  document,
  status,
  onNameChange,
  onDocumentChange,
  onStatusChange,
  onClearFilters,
  selectedCount,
  onBulkAction,
  isLoading,
}: ClientsToolbarProps) {
  // Estados locais para inputs com debounce
  const [localName, setLocalName] = useState(name);
  const [localDocument, setLocalDocument] = useState(document);

  // Sincronizar com props
  useEffect(() => {
    setLocalName(name);
  }, [name]);

  useEffect(() => {
    setLocalDocument(document);
  }, [document]);

  // Debounced handlers
  const debouncedNameChange = useDebouncedCallback((value: string) => {
    onNameChange(value);
  }, 500);

  const debouncedDocumentChange = useDebouncedCallback((value: string) => {
    onDocumentChange(value);
  }, 500);

  const handleNameChange = (value: string) => {
    setLocalName(value);
    debouncedNameChange(value);
  };

  const handleDocumentChange = (value: string) => {
    setLocalDocument(value);
    debouncedDocumentChange(value);
  };

  const hasFilters = name || document || status;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nome..."
          value={localName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="h-9 w-full sm:w-[200px]"
        />
        <Input
          placeholder="Buscar por documento..."
          value={localDocument}
          onChange={(e) => handleDocumentChange(e.target.value)}
          className="h-9 w-full sm:w-[180px]"
        />
        <Select
          value={status || "all"}
          onValueChange={(value) =>
            onStatusChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9"
          >
            Limpar
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {selectedCount > 0 && (
        <Button onClick={onBulkAction} size="sm">
          Atualizar {selectedCount} selecionado(s)
        </Button>
      )}
    </div>
  );
}
