"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

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
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse documents from the prop string
  const documentTags = useMemo(() => {
    if (!document || !document.trim()) return [];
    return document
      .trim()
      .split(/\s+/)
      .filter((d) => d.length > 0);
  }, [document]);

  // Sincronizar com props
  useEffect(() => {
    setLocalName(name);
  }, [name]);

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

  const handleDocumentInputChange = (value: string) => {
    // Check if user added a space (indicating they want to add a tag)
    if (value.endsWith(" ") && value.trim()) {
      const newDoc = value.trim();
      if (newDoc && !documentTags.includes(newDoc)) {
        const newDocuments = [...documentTags, newDoc].join(" ");
        debouncedDocumentChange(newDocuments);
      }
      setInputValue("");
    } else {
      setInputValue(value);
    }
  };

  const handleDocumentInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newDoc = inputValue.trim();
      if (!documentTags.includes(newDoc)) {
        const newDocuments = [...documentTags, newDoc].join(" ");
        debouncedDocumentChange(newDocuments);
      }
      setInputValue("");
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      documentTags.length > 0
    ) {
      // Remove last tag when pressing backspace on empty input
      const newDocuments = documentTags.slice(0, -1).join(" ");
      debouncedDocumentChange(newDocuments);
    }
  };

  const removeDocumentTag = (docToRemove: string) => {
    const newDocuments = documentTags
      .filter((doc) => doc !== docToRemove)
      .join(" ");
    debouncedDocumentChange(newDocuments);
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

        {/* Document Tags Input */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Custom tag input container with real input inside */}
        <div
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "sm:w-[280px] cursor-text",
          )}
          onClick={() => inputRef.current?.focus()}
          onKeyDown={() => inputRef.current?.focus()}
        >
          {documentTags.map((doc) => (
            <Badge
              key={doc}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs font-normal"
            >
              {doc}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDocumentTag(doc);
                }}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleDocumentInputChange(e.target.value)}
            onKeyDown={handleDocumentInputKeyDown}
            placeholder={
              documentTags.length === 0 ? "Digite documentos..." : ""
            }
            className="min-w-[80px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

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
