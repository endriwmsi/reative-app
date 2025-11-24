import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { DocumentsForm } from "../_components/documents-form";

export default async function DocumentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Documentos</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie seus documentos de identificação (CPF ou CNPJ).
        </p>
      </div>
      <Separator />
      <DocumentsForm
        defaultValues={{
          cpf: session.user.cpf || "",
          cnpj: session.user.cnpj || "",
        }}
      />
    </div>
  );
}
