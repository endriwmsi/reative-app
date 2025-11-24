import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Segurança</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie sua senha e segurança da conta.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h4 className="font-medium">Senha</h4>
            <p className="text-sm text-muted-foreground">
              Alterar sua senha de acesso.
            </p>
          </div>
          <Button variant="outline">Alterar Senha</Button>
        </div>
      </div>
    </div>
  );
}
