"use client";

import { Badge } from "@/components/ui/badge";
import type { SubmissionClientStatus } from "@/db/schema";

const STATUS_CONFIG: Record<
  SubmissionClientStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pendente", variant: "secondary" },
  processing: { label: "Processando", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

interface ClientStatusBadgeProps {
  status: SubmissionClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
