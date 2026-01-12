import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCoupons } from "@/actions/coupon/coupon.action";
import { getUserProducts } from "@/actions/product/product.action";
import { auth } from "@/auth";
import CouponsTable from "@/components/coupons-table";
import CreateCouponDialog from "@/components/create-coupon-dialog";

export const metadata: Metadata = {
  title: "Hub LN - Meus Cupons",
  description: "Gerencie seus cupons de forma fácil e rápida.",
};

export default async function CouponsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Buscar cupons do usuário e produtos disponíveis
  const [couponsResult, productsResult] = await Promise.all([
    getUserCoupons(session.user.id),
    getUserProducts(session.user.id),
  ]);

  if (!couponsResult.success) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar cupons</h1>
          <p className="text-muted-foreground">
            {couponsResult.error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  if (!productsResult.success) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar produtos</h1>
          <p className="text-muted-foreground">
            {productsResult.error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">
            Crie e gerencie cupons de desconto para seus produtos.
          </p>
        </div>

        <CreateCouponDialog
          products={productsResult.data || []}
          userId={session.user.id}
        />
      </div>

      <CouponsTable coupons={couponsResult.data || []} />
    </div>
  );
}
