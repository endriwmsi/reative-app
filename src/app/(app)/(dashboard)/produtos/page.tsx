import { eq } from "drizzle-orm";
import { Upload } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getProductsForUser,
  getUserProducts,
} from "@/actions/product/product.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { user } from "@/db/schema/user";
import ProductsTable from "./_components/products-table";
import ProductsView from "./_components/products-view";

export const metadata: Metadata = {
  title: "Hub LN - Meus Produtos",
  description: "Solicite serviços de forma fácil e rápida.",
};

export default async function ProductsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verificar se o usuário tem indicados (é um indicador) ou foi indicado
  const [userData] = await db
    .select({
      id: user.id,
      referredBy: user.referredBy,
    })
    .from(user)
    .where(eq(user.id, session.user.id));

  if (!userData) {
    redirect("/login");
  }

  // Se o usuário foi indicado por alguém, mostrar produtos com preços do indicador
  if (userData.referredBy) {
    const {
      success,
      data: products,
      error,
    } = await getProductsForUser(session.user.id);

    if (!success || !products) {
      return (
        <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Erro ao carregar produtos</h1>
            <p className="text-muted-foreground">
              {error || "Tente novamente mais tarde"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Produtos e Serviços</h1>
          <p className="text-muted-foreground">
            Produtos disponíveis com preços especiais do seu indicador.
          </p>
        </div>

        <ProductsView products={products} userId={session.user.id} />
      </div>
    );
  }

  // Se o usuário não foi indicado, é um indicador - mostrar interface para gerenciar preços
  const {
    success,
    data: products,
    error,
  } = await getUserProducts(session.user.id);

  if (!success || !products) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar produtos</h1>
          <p className="text-muted-foreground">
            {error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Produtos e Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os preços dos produtos que você oferece aos seus indicados
            e crie cupons de desconto.
          </p>
        </div>

        <Button className="gap-2 mt-4 sm:mt-0 w-full sm:w-auto" asChild>
          <Link href="/produtos/novo-produto">
            <Upload className="h-4 w-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      <ProductsTable products={products} userId={session.user.id} />
    </div>
  );
}
