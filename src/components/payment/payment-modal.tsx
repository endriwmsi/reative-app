"use client";

import {
  Check,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  checkPaymentStatus,
  refreshPaymentData,
} from "@/actions/payment/payment.action";
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

  useEffect(() => {
    setCurrentPaymentData(paymentData);
  }, [paymentData]);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Debug: Log dos dados recebidos
  console.log("=== Payment Modal Data Debug ===");
  console.log("Payment Data:", paymentData);
  console.log("QR Code present:", !!paymentData.qrCode);
  console.log("QR Code length:", paymentData.qrCode?.length || 0);
  console.log("PIX Copy Paste present:", !!paymentData.pixCopyPaste);
  console.log("PIX Copy Paste length:", paymentData.pixCopyPaste?.length || 0);

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
    setCheckingPayment(true);
    try {
      const result = await checkPaymentStatus(currentPaymentData.paymentId);

      if (result.success) {
        toast.success("Status do pagamento atualizado!");
        onPaymentSuccess?.();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Erro ao verificar pagamento");
    } finally {
      setCheckingPayment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para realizar o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  R${" "}
                  {currentPaymentData.totalAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <Separator />

              <div>
                <span className="text-sm text-muted-foreground">
                  Envios inclusos:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentPaymentData.submissionTitles.map((title) => (
                    <Badge key={title} variant="secondary" className="text-xs">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              {currentPaymentData.qrCode ? (
                <Image
                  className="w-48 h-48 bg-contain bg-no-repeat bg-center"
                  src={`data:image/png;base64,${currentPaymentData.qrCode}`}
                  alt="QR Code PIX"
                  width={192}
                  height={192}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      {currentPaymentData.qrCode === ""
                        ? "QR Code não disponível"
                        : "Carregando QR Code..."}
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
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {currentPaymentData.qrCode
                ? "Escaneie o QR Code com o app do seu banco"
                : "QR Code será gerado em alguns segundos"}
            </p>
          </div>

          {/* PIX Copy and Paste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Código PIX (Copia e Cola)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded border text-xs font-mono break-all min-h-[3rem] flex items-center">
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
                <p className="text-xs text-muted-foreground mt-2">
                  Cole este código no app do seu banco para efetuar o pagamento
                </p>
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
                disabled={checkingPayment}
              >
                {checkingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Verificar Pagamento
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
