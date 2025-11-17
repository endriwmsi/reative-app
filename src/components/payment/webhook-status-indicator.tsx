"use client";

import { CheckCircle, Clock, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WebhookStatusIndicatorProps {
  isPaid: boolean;
  isChecking: boolean;
  className?: string;
}

export function WebhookStatusIndicator({
  isPaid,
  isChecking,
  className = "",
}: WebhookStatusIndicatorProps) {
  if (isPaid) {
    return (
      <Badge
        variant="secondary"
        className={`bg-green-100 text-green-700 ${className}`}
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Confirmado via Webhook
      </Badge>
    );
  }

  if (isChecking) {
    return (
      <Badge
        variant="secondary"
        className={`bg-blue-100 text-blue-700 ${className}`}
      >
        <Wifi className="h-3 w-3 mr-1 animate-pulse" />
        Verificando...
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      Webhook Ativo
    </Badge>
  );
}
