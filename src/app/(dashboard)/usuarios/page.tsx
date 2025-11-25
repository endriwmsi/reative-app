import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAllUsers,
  isUserAdmin,
} from "@/actions/user/user-management.action";
import { UsersTable } from "@/app/(dashboard)/usuarios/_components/users-table";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Hub LN - Gerenciador de Usuários",
  description: "Gerenciar contas de usuários e aprovar novos cadastros.",
};

export default async function UsersPage() {
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

  const usersResult = await getAllUsers();

  if (!usersResult.success) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar usuários</h1>
          <p className="text-muted-foreground">
            {usersResult.error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie contas de usuários e aprove novos cadastros
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <UsersTable users={usersResult.data || []} />
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Total de usuários: {usersResult.data?.length || 0}
      </div>
    </div>
  );
}
