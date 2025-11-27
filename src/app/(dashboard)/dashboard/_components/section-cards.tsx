import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import type { DashboardMetrics } from "@/actions/dashboard/dashboard-metrics.action";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardsProps {
  metrics: DashboardMetrics;
}

const SectionCards = ({ metrics }: SectionCardsProps) => {
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? IconTrendingUp : IconTrendingDown;
  };

  return (
    <div className="overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
      <div className="flex gap-4 px-4 lg:grid lg:grid-cols-4 lg:gap-4 lg:px-6 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
        {/* <Card className="@container/card min-w-[280px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
        <CardHeader>
          <CardDescription>Saldo Disponível</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            R${" "}
            {metrics.saldoDisponivel.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {(() => {
                const GrowthIcon = getGrowthIcon(
                  metrics.growthIndicators.saldoDisponivel,
                );
                return (
                  <GrowthIcon
                    className={getGrowthColor(
                      metrics.growthIndicators.saldoDisponivel,
                    )}
                  />
                );
              })()}+{metrics.growthIndicators.saldoDisponivel.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Crescimento mensal{" "}
            <IconTrendingUp
              className={`size-4 ${getGrowthColor(metrics.growthIndicators.saldoDisponivel)}`}
            />
          </div>
          <div className="text-muted-foreground">Disponível para saque</div>
        </CardFooter>
      </Card> */}

        <Card className="@container/card min-w-[280px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
          <CardHeader>
            <CardDescription>Total Vendas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              R${" "}
              {metrics.totalVendas.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {(() => {
                  const GrowthIcon = getGrowthIcon(
                    metrics.growthIndicators.totalVendas,
                  );
                  return (
                    <GrowthIcon
                      className={getGrowthColor(
                        metrics.growthIndicators.totalVendas,
                      )}
                    />
                  );
                })()}+{metrics.growthIndicators.totalVendas.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Excelente performance{" "}
              <IconTrendingUp
                className={`size-4 ${getGrowthColor(metrics.growthIndicators.totalVendas)}`}
              />
            </div>
            <div className="text-muted-foreground">Vendas acumuladas</div>
          </CardFooter>
        </Card>

        <Card className="@container/card min-w-[280px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
          <CardHeader>
            <CardDescription>Vendas Hoje</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              R${" "}
              {metrics.vendasHoje.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {(() => {
                  const GrowthIcon = getGrowthIcon(
                    metrics.growthIndicators.vendasHoje,
                  );
                  return (
                    <GrowthIcon
                      className={getGrowthColor(
                        metrics.growthIndicators.vendasHoje,
                      )}
                    />
                  );
                })()}+{metrics.growthIndicators.vendasHoje.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Dia produtivo{" "}
              <IconTrendingUp
                className={`size-4 ${getGrowthColor(metrics.growthIndicators.vendasHoje)}`}
              />
            </div>
            <div className="text-muted-foreground">Vendas do dia atual</div>
          </CardFooter>
        </Card>

        <Card className="@container/card min-w-[280px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
          <CardHeader>
            <CardDescription>Indicados Diretos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.parceirosIndicados}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconUsers
                  className={getGrowthColor(
                    metrics.growthIndicators.parceirosIndicados,
                  )}
                />
                Ativos
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Rede em crescimento{" "}
              <IconUsers
                className={`size-4 ${getGrowthColor(metrics.growthIndicators.parceirosIndicados)}`}
              />
            </div>
            <div className="text-muted-foreground">
              Parceiros indicados por você
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card min-w-[280px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
          <CardHeader>
            <CardDescription>Total Faturamento</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              R${" "}
              {metrics.totalFaturamento.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {(() => {
                  const GrowthIcon = getGrowthIcon(
                    metrics.growthIndicators.totalFaturamento,
                  );
                  return (
                    <GrowthIcon
                      className={getGrowthColor(
                        metrics.growthIndicators.totalFaturamento,
                      )}
                    />
                  );
                })()}+{metrics.growthIndicators.totalFaturamento.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Crescimento consistente{" "}
              <IconTrendingUp
                className={`size-4 ${getGrowthColor(metrics.growthIndicators.totalFaturamento)}`}
              />
            </div>
            <div className="text-muted-foreground">
              Faturamento total da rede
            </div>
          </CardFooter>
        </Card>

        {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ativos/Inativos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {Math.round(metrics.parceirosIndicados * 0.89)}/
            {Math.round(metrics.parceirosIndicados * 0.11)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {(() => {
                const GrowthIcon = getGrowthIcon(
                  metrics.growthIndicators.parceirosIndicados,
                );
                return (
                  <GrowthIcon
                    className={getGrowthColor(
                      metrics.growthIndicators.parceirosIndicados,
                    )}
                  />
                );
              })()}
              {Math.round(
                (metrics.parceirosIndicados > 0
                  ? (metrics.parceirosIndicados * 0.89) /
                    metrics.parceirosIndicados
                  : 0) * 100,
              )}
              % Ativos
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Alta retenção{" "}
            <IconTrendingUp
              className={`size-4 ${getGrowthColor(metrics.growthIndicators.parceirosIndicados)}`}
            />
          </div>
          <div className="text-muted-foreground">Status dos parceiros</div>
        </CardFooter>
      </Card> */}
        {/* Elemento invisível para criar espaço à direita em mobile */}
        <div className="w-2 flex-shrink-0 lg:hidden" aria-hidden="true" />
      </div>
    </div>
  );
};

export default SectionCards;
