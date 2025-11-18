"use client";

import { Progress } from "../ui/progress";

interface PaymentCheckProgressProps {
  isChecking: boolean;
  checkCount: number;
  maxChecks: number;
}

export function PaymentCheckProgress({
  isChecking,
  checkCount,
  maxChecks,
}: PaymentCheckProgressProps) {
  const progressPercentage = (checkCount / maxChecks) * 100;

  if (checkCount >= maxChecks) {
    return (
      <div className="text-center">
        <div className="text-xs text-muted-foreground">
          Verificações automáticas concluídas
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          Verificações: {checkCount}/{maxChecks}
        </span>
        {isChecking && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Verificando...
          </span>
        )}
      </div>
      <Progress
        value={progressPercentage}
        className="h-2 bg-amber-100 dark:bg-amber-900"
      />
    </div>
  );
}
