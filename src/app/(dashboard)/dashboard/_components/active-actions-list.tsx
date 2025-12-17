import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getActiveCleanNameActions } from "@/actions/clean-name-action/clean-name-action.action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export async function ActiveActionsList() {
  const result = await getActiveCleanNameActions();
  const actions = result.success && result.data ? result.data : [];

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Últimas ações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className="border rounded-xl p-4 space-y-4 bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-lg text-primary">
                      {action.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                        Início:{" "}
                        {format(new Date(action.startDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      <span>→</span>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                        Fim:{" "}
                        {format(new Date(action.endDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
                  <StatusItem
                    label="Boa Vista"
                    status={action.boaVistaStatus}
                  />
                  <StatusItem label="SPC" status={action.spcStatus} />
                  <StatusItem label="Serasa" status={action.serasaStatus} />
                  <StatusItem
                    label="Cenprot SP"
                    status={action.cenprotSpStatus}
                  />
                  <StatusItem
                    label="Cenprot Nacional"
                    status={action.cenprotNacionalStatus}
                  />
                  <StatusItem label="Outros" status={action.outrosStatus} />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  let className = "bg-gray-100 text-gray-800 hover:bg-gray-100/80";

  if (status === "Baixas completas") {
    className =
      "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200";
  } else if (status === "Baixas Iniciadas") {
    className =
      "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200";
  } else if (status === "Aguardando baixas") {
    className =
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200";
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Badge
        variant="outline"
        className={`w-full justify-center whitespace-nowrap text-[10px] px-1 py-1 h-auto ${className}`}
      >
        {status}
      </Badge>
    </div>
  );
}
