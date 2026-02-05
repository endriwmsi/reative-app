"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubmissionClientStatus } from "@/db/schema";
import { useUpdateClientStatusBulk } from "@/hooks/use-submission-clients";

const STATUS_OPTIONS: { value: SubmissionClientStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Processando" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "cancelled", label: "Cancelado" },
];

interface BulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function BulkStatusDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<
    SubmissionClientStatus | ""
  >("");
  const bulkUpdate = useUpdateClientStatusBulk();

  const handleSubmit = () => {
    if (!selectedStatus) return;

    bulkUpdate.mutate(
      {
        clientIds: selectedIds,
        newStatus: selectedStatus,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setSelectedStatus("");
            onSuccess();
          }
        },
      },
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedStatus("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Status em Lote</DialogTitle>
          <DialogDescription>
            Você está prestes a atualizar o status de{" "}
            <strong>{selectedIds.length}</strong> cliente(s) selecionado(s).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <span className="text-sm font-medium mb-2 block">
            Novo status para os clientes selecionados:
          </span>
          <Select
            value={selectedStatus}
            onValueChange={(value) =>
              setSelectedStatus(value as SubmissionClientStatus)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={bulkUpdate.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus || bulkUpdate.isPending}
          >
            {bulkUpdate.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Atualizar {selectedIds.length} cliente(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
