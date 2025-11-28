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
import { checkPaymentStatusAction } from "@/actions/billing/check-payment-status.action";
import { createBillingAction } from "@/actions/billing/create-billing.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onPaymentSuccess: () => void;
}

interface PixQrCodeData {
  brCode: string;
  brCodeBase64: string;
}

export function PaymentModal({
  open,
  onOpenChange,
  userId,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [pixQrCodeData, setPixQrCodeData] = useState<PixQrCodeData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!open || isPaid) return;

    const checkStatus = async () => {
      try {
        const result = await checkPaymentStatusAction(userId);
        if (result.status === "active") {
          setIsPaid(true);
          toast.success("Pagamento confirmado!", {
            description: "Sua assinatura foi ativada com sucesso.",
          });
          setTimeout(() => {
            onPaymentSuccess();
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      }
    };

    // Verificar imediatamente
    // checkStatus();

    // Configurar intervalo de 3 segundos
    const intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [open, userId, isPaid, onPaymentSuccess]);

  useEffect(() => {
    if (open && !pixQrCodeData && !isLoading) {
      const createPixQrCode = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await createBillingAction(userId);
          if (result.error) {
            setError(result.error);
            toast.error(result.error);
          } else {
            setPixQrCodeData(result.data as PixQrCodeData);
          }
        } catch {
          setError("Erro ao gerar QR Code");
          toast.error("Erro ao gerar QR Code");
        } finally {
          setIsLoading(false);
        }
      };
      createPixQrCode();
    }
  }, [open, userId, pixQrCodeData, isLoading]);

  const copyToClipboard = async () => {
    if (!pixQrCodeData?.brCode) return;
    try {
      await navigator.clipboard.writeText(pixQrCodeData.brCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleRefresh = () => {
    setPixQrCodeData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento PIX (AbacatePay)
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para realizar o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Card className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            {isPaid ? (
              <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Pagamento Confirmado!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-semibold">
                  Aguardando confirmação do pagamento...
                </span>
              </div>
            )}
            <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
              {isPaid
                ? "Redirecionando..."
                : "O sistema identificará seu pagamento automaticamente."}
            </p>
          </Card>

          {!isPaid && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* QR Code */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code PIX
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="w-48 h-48 flex items-center justify-center border rounded-lg bg-white relative">
                      {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : error ? (
                        <div className="text-center p-2">
                          <p className="text-xs text-red-500 mb-2">{error}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Tentar
                            novamente
                          </Button>
                        </div>
                      ) : pixQrCodeData?.brCodeBase64 ? (
                        <Image
                          src={pixQrCodeData.brCodeBase64}
                          alt="QR Code PIX"
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          QR Code indisponível
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Escaneie com o app do seu banco
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* PIX Copy and Paste */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Código PIX (Copia e Cola)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-secondary rounded border text-xs font-mono break-all min-h-[2.5rem] flex items-center">
                      {isLoading ? (
                        <span className="text-muted-foreground italic">
                          Gerando código...
                        </span>
                      ) : pixQrCodeData?.brCode ? (
                        pixQrCodeData.brCode
                      ) : (
                        <span className="text-muted-foreground italic">
                          Código indisponível
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={!pixQrCodeData?.brCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>

                <Button
                  onClick={onPaymentSuccess}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Já realizei o pagamento
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
