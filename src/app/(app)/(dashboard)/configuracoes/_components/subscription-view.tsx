"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Rocket,
  Settings,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getSubscriptionData,
  type SubscriptionData,
} from "@/actions/billing/get-subscription-data.action";
import { PaymentModal } from "@/components/payment/abacate/payment-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";

export function SubscriptionView() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    status: "none",
    planName: "Gratuito",
    price: 0,
    startDate: null,
    renewalDate: null,
  });

  const fetchSubscriptionData = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const data = await getSubscriptionData(session.user.id);
        setSubscriptionData(data);
      } catch (error) {
        console.error("Erro ao buscar dados da assinatura:", error);
        // Lide com o erro aqui
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    fetchSubscriptionData();
  };

  // Calculate progress for trial
  const calculateProgress = () => {
    if (
      subscriptionData.status !== "trial" ||
      !subscriptionData.trialStartDate ||
      !subscriptionData.trialEndDate
    )
      return 0;

    const trialStart = new Date(subscriptionData.trialStartDate);
    const trialEnd = new Date(subscriptionData.trialEndDate);
    const today = new Date();

    const totalDays =
      (trialEnd.getTime() - trialStart.getTime()) / (1000 * 3600 * 24);
    const daysLeft =
      (trialEnd.getTime() - today.getTime()) / (1000 * 3600 * 24);

    const daysPassed = totalDays - daysLeft;
    return (daysPassed / totalDays) * 100;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="flex flex-col space-y-6 mx-auto">
      {/* Alerts Section */}
      {subscriptionData.status === "expired" && (
        <Alert
          variant="destructive"
          className="border-red-500/50 bg-red-500/10"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Assinatura Expirada</AlertTitle>
          <AlertDescription>
            Sua assinatura expirou em {formatDate(subscriptionData.renewalDate)}
            . Renove agora para continuar acessando todos os recursos e evitar
            bloqueios.
          </AlertDescription>
        </Alert>
      )}

      {subscriptionData.status === "trial" && (
        <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Período de Teste Ativo</AlertTitle>
          <AlertDescription>
            Você está aproveitando o período de teste gratuito. Faltam{" "}
            <strong>{subscriptionData.daysLeft} dias</strong> para o término.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-6">
        {/* Current Plan Card */}
        <Card className="border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plano Atual</span>
              {subscriptionData.status === "active" && (
                <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
              )}
              {subscriptionData.status === "trial" && (
                <Badge
                  variant="secondary"
                  className="text-blue-600 bg-blue-100"
                >
                  Trial
                </Badge>
              )}
              {subscriptionData.status === "expired" && (
                <Badge variant="destructive">Expirado</Badge>
              )}
              {subscriptionData.status === "pending" && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  Pagamento Pendente
                </Badge>
              )}
              {subscriptionData.status === "none" && (
                <Badge variant="outline">Gratuito</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Detalhes da sua assinatura vigente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xl font-bold">{subscriptionData.planName}</p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionData.status === "none"
                    ? "Funcionalidades limitadas"
                    : subscriptionData.status === "trial"
                      ? "Período de avaliação gratuita"
                      : subscriptionData.status === "pending"
                        ? "Aguardando confirmação de pagamento"
                        : `R$ ${subscriptionData.price.toFixed(2)} / mês (Renovação Mensal)`}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Data de Início</span>
                </div>
                <span className="font-medium">
                  {formatDate(subscriptionData.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {subscriptionData.status === "expired"
                      ? "Expirou em"
                      : subscriptionData.status === "trial"
                        ? "Fim do Teste"
                        : "Próxima Renovação"}
                  </span>
                </div>
                <span className="font-medium">
                  {subscriptionData.status === "trial"
                    ? formatDate(subscriptionData.trialEndDate)
                    : formatDate(subscriptionData.renewalDate)}
                </span>
              </div>
            </div>

            {/* Trial Progress */}
            {subscriptionData.status === "trial" && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Início: {formatDate(subscriptionData.trialStartDate)}
                  </span>
                  <span>Fim: {formatDate(subscriptionData.trialEndDate)}</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {subscriptionData.daysLeft} dias restantes no período de teste
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {subscriptionData.status === "active" ? (
              <Button variant="outline" className="w-full gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar Pagamento
              </Button>
            ) : subscriptionData.status === "trial" ? (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full gap-2"
                size="lg"
              >
                <Rocket className="h-4 w-4" />
                Assinar Agora
              </Button>
            ) : subscriptionData.status === "pending" ? (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full gap-2"
                size="lg"
                variant="outline"
              >
                <CreditCard className="h-4 w-4" />
                Concluir Pagamento
              </Button>
            ) : (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full gap-2"
                size="lg"
              >
                {subscriptionData.status === "none" ? (
                  <Rocket className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {subscriptionData.status === "none"
                  ? "Fazer Upgrade"
                  : "Renovar Assinatura"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Plan Features / Benefits (Static for now as there is only one plan) */}
        <Card className="border-muted shadow-sm bg-muted/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Recursos do Plano PRO
            </CardTitle>
            <CardDescription>
              Tudo o que você ganha ao assinar o plano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Acesso ilimitado a todos os recursos",
                "Suporte prioritário 24/7",
                "Dashboard avançado de métricas",
                "Exportação de dados em Excel",
                "Sem limites de uso",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2">
            <p className="text-xs text-muted-foreground">
              * A cobrança é feita mensalmente. Cancele a qualquer momento.
            </p>
          </CardFooter>
        </Card>
      </div>

      {session?.user?.id && (
        <PaymentModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          userId={session.user.id}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
