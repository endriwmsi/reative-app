"use client";

import { Progress } from "../ui/progress";

interface PaymentCheckProgressProps {
  isChecking: boolean;
  checkCount: number;
  maxChecks: number;
  nextCheckIn?: number; // segundos até próxima verificação
}

export function PaymentCheckProgress({
  isChecking,
  checkCount,
  maxChecks,
}: PaymentCheckProgressProps) {
  const progressPercentage = (checkCount / maxChecks) * 100;

  if (checkCount >= maxChecks) {
    return (
      <div className="text-center space-y-2">
        <div className="text-xs text-muted-foreground">
          Verificações automáticas concluídas
        </div>
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💡 O pagamento ainda será confirmado automaticamente via webhook
          quando processado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Verificações: {checkCount}/{maxChecks}
        </span>
        {isChecking && <span className="text-blue-600">Verificando...</span>}
      </div>
      <Progress value={progressPercentage} className="h-1" />
      <div className="text-xs text-muted-foreground text-center">
        🚀 Sistema verificando automaticamente
      </div>
    </div>
  );
}
