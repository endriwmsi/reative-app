"use client";

import {
  Check,
  CheckCircle,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { refreshPaymentData } from "@/actions/payment/payment.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { usePaymentBroadcast } from "@/hooks/use-payment-broadcast";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { PaymentCheckProgress } from "./payment-check-progress";
import { WebhookStatusIndicator } from "./webhook-status-indicator";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentData: {
    paymentId: string;
    qrCode: string;
    pixCopyPaste: string;
    paymentUrl: string;
    totalAmount: number;
    submissionTitles: string[];
  };
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  paymentData,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(paymentData);

  // Hook para comunicação entre abas
  const { broadcastPaymentConfirmed } = usePaymentBroadcast();

  useEffect(() => {
    setCurrentPaymentData(paymentData);
  }, [paymentData]);

  // Hook para verificação automática de status
  const {
    isPaid,
    status: paymentStatus,
    isChecking: checkingPayment,
    checkCount,
    maxChecks,
    nextCheckIn,
    lastChecked,
    manualCheck,
    stopChecking,
  } = usePaymentStatus({
    paymentId: paymentData.paymentId,
    enabled: open, // Só verifica quando o modal está aberto
    onPaymentConfirmed: () => {
      stopChecking();

      // Broadcast para outras abas que pagamento foi confirmado
      broadcastPaymentConfirmed(
        paymentData.paymentId,
        "Seus envios foram processados com sucesso!",
      );

      // Mostrar toast de sucesso personalizado
      toast.success("🎉 Pagamento Confirmado!", {
        description:
          "Confirmação recebida automaticamente! Seus envios foram processados com sucesso.",
        duration: 5000,
      });

      // Fechar modal automaticamente após 2 segundos
      setTimeout(() => {
        onPaymentSuccess?.();
        onOpenChange(false);
      }, 2000);
    },
    onStatusUpdate: (status, paid) => {
      console.log(`Payment status updated: ${status}, isPaid: ${paid}`);
    },
  });

  // Cleanup quando o modal for fechado
  useEffect(() => {
    if (!open) {
      stopChecking();
    }
  }, [open, stopChecking]);

  // Debug: Log dos dados recebidos (apenas em desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    console.log("=== Payment Modal Data Debug ===");
    console.log("Payment Data:", {
      paymentId: paymentData.paymentId,
      hasQrCode: !!paymentData.qrCode,
      hasPixCode: !!paymentData.pixCopyPaste,
      totalAmount: paymentData.totalAmount,
      submissionCount: paymentData.submissionTitles.length,
    });
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentPaymentData.pixCopyPaste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleRefreshPaymentData = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshPaymentData(currentPaymentData.paymentId);

      if (result.success && result.data) {
        setCurrentPaymentData((prev) => ({
          ...prev,
          qrCode: result.data.qrCode,
          pixCopyPaste: result.data.pixCopyPaste,
        }));
        toast.success("Dados do pagamento atualizados!");
      } else {
        toast.error(result.message || "Erro ao atualizar dados");
      }
    } catch {
      toast.error("Erro ao atualizar dados do pagamento");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckPayment = async () => {
    await manualCheck();
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      PENDING: "Pendente",
      AWAITING_PAYMENT: "Aguardando Pagamento",
      RECEIVED: "Confirmado",
      OVERDUE: "Vencido",
      CANCELLED: "Cancelado",
      REFUNDED: "Reembolsado",
    };
    return statusLabels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento PIX
            </div>
            <WebhookStatusIndicator
              isPaid={isPaid}
              isChecking={checkingPayment}
              className="text-xs"
            />
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para realizar o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Status do Pagamento Aprimorado */}
          {isPaid ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Pagamento Confirmado!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Seus envios foram processados com sucesso.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  {checkingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {checkingPayment
                      ? "Verificando pagamento..."
                      : "Aguardando pagamento"}
                  </span>
                </div>
                {lastChecked && (
                  <span className="text-xs text-blue-600">
                    Última verificação: {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-600">
                {paymentStatus === "PENDING"
                  ? "O sistema verificará automaticamente quando o pagamento for realizado."
                  : `Status atual: ${getStatusLabel(paymentStatus)}`}
              </p>
              {/* Componente de progresso das verificações */}
              <PaymentCheckProgress
                isChecking={checkingPayment}
                checkCount={checkCount}
                maxChecks={maxChecks}
                nextCheckIn={nextCheckIn}
              />
            </div>
          )}

          {/* Layout Horizontal - Informações + QR Code */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Resumo do Pagamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo do Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    R${" "}
                    {currentPaymentData.totalAmount
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>
                </div>

                <Separator />

                <div>
                  <span className="text-sm text-muted-foreground">
                    Envios inclusos:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
                    {currentPaymentData.submissionTitles.map((title) => (
                      <Badge
                        key={title}
                        variant="secondary"
                        className="text-xs"
                      >
                        {title}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-36 h-36 flex items-center justify-center border rounded-lg bg-white">
                  {currentPaymentData.qrCode ? (
                    <Image
                      src={`data:image/png;base64,${currentPaymentData.qrCode}`}
                      alt="QR Code PIX"
                      width={130}
                      height={130}
                      className="rounded"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-xs text-gray-500 mb-2">
                        {currentPaymentData.qrCode === ""
                          ? "QR Code não disponível"
                          : "Carregando..."}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshPaymentData}
                        disabled={isRefreshing}
                        className="text-xs"
                      >
                        {isRefreshing ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Tentar novamente
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {currentPaymentData.qrCode
                    ? "Escaneie com o app do seu banco"
                    : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PIX Copy and Paste */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Código PIX (Copia e Cola)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-secondary rounded border text-xs font-mono break-all min-h-[2.5rem] flex items-center">
                  {currentPaymentData.pixCopyPaste ? (
                    currentPaymentData.pixCopyPaste
                  ) : (
                    <span className="text-gray-500 italic">
                      {currentPaymentData.pixCopyPaste === ""
                        ? "Código PIX não disponível"
                        : "Carregando código PIX..."}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!currentPaymentData.pixCopyPaste}
                  title={
                    currentPaymentData.pixCopyPaste
                      ? "Copiar código PIX"
                      : "Código PIX não disponível"
                  }
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {currentPaymentData.pixCopyPaste && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground">
                    Cole este código no app do seu banco para efetuar o
                    pagamento
                  </p>
                  <p className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                    💡 O pagamento será confirmado automaticamente após o PIX
                    ser processado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleRefreshPaymentData}
                disabled={isRefreshing}
                title="Recarregar QR Code e código PIX"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>

              <Button
                variant="outline"
                onClick={handleCheckPayment}
                disabled={checkingPayment || isPaid}
                className={isPaid ? "text-green-600 border-green-600" : ""}
              >
                {checkingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isPaid ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isPaid
                  ? "Pago ✓"
                  : checkingPayment
                    ? "Verificando..."
                    : "Verificar Agora"}
              </Button>
            </div>

            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {paymentData.paymentUrl && (
                <Button asChild>
                  <a
                    href={paymentData.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir no Asaas
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
