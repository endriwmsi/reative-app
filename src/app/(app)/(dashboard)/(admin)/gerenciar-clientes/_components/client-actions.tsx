"use client";

import { Loader2, MoreHorizontal } from "lucide-react";
import type { SubmissionClientWithUser } from "@/actions/submission/submission-client-admin.action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SubmissionClientStatus } from "@/db/schema";
import { useUpdateClientStatus } from "@/hooks/use-submission-clients";

const STATUS_OPTIONS: { value: SubmissionClientStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "processing", label: "Processando" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "cancelled", label: "Cancelado" },
];

interface ClientActionsProps {
  client: SubmissionClientWithUser;
}

export function ClientActions({ client }: ClientActionsProps) {
  const updateStatus = useUpdateClientStatus();

  const handleStatusChange = (newStatus: SubmissionClientStatus) => {
    updateStatus.mutate({ clientId: client.id, newStatus });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          {updateStatus.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={client.status === option.value || updateStatus.isPending}
          >
            {option.label}
            {client.status === option.value && " (atual)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
