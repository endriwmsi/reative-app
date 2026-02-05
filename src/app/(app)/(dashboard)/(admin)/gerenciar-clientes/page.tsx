import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/actions/user/user-management.action";
import { auth } from "@/auth";
import { ClientsManager } from "./_components/clients-manager";

export const metadata: Metadata = {
  title: "Hub LN - Gerenciar Clientes",
  description: "Gerenciar status dos clientes enviados.",
};

export default async function GerenciarClientesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verificar se o usuário é admin
  const adminCheck = await isUserAdmin(session.user.id);

  if (!adminCheck.success || !adminCheck.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie o status dos clientes enviados pelos usuários
          </p>
        </div>
      </div>

      <ClientsManager />
    </div>
  );
}
