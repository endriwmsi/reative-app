"use client";

import { useEffect, useState } from "react";
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
  nextCheckIn = 0,
}: PaymentCheckProgressProps) {
  const [timeLeft, setTimeLeft] = useState(nextCheckIn);

  useEffect(() => {
    setTimeLeft(nextCheckIn);
  }, [nextCheckIn]);

  useEffect(() => {
    if (timeLeft > 0 && !isChecking) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, isChecking]);

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
        {timeLeft > 0 && !isChecking && (
          <span>Próxima verificação em {timeLeft}s</span>
        )}
        {isChecking && <span className="text-blue-600">Verificando...</span>}
      </div>
      <Progress value={progressPercentage} className="h-1" />
      <div className="text-xs text-muted-foreground text-center">
        🚀 Confirmação automática via webhook habilitada
      </div>
    </div>
  );
}
