import { eq } from "drizzle-orm";
import { Upload } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getProductsForUser,
  getUserProducts,
} from "@/actions/product/product.action";
import { getUserSubmissions } from "@/actions/submission/submission.action";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { user } from "@/db/schema/user";
import SubmissionsTable from "./_components/submissions-table";
import "@/types/auth";
import { CreateSubmissionDialog } from "./_components/create-submission-dialog";

type SubmissionData = {
  id: string;
  title: string;
  totalAmount: string;
  unitPrice: string;
  quantity: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  productName: string;
  productCategory: string;
  userName: string;
  userEmail: string;
  canViewClients?: boolean;
  isPaid: boolean;
  paymentDate?: Date | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
};

export default async function EnviosPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verificar se o usuário é admin através da propriedade do user
  const isAdmin =
    Boolean((session.user as Record<string, unknown>).isAdmin) || false;

  // Verificar se o usuário foi indicado para usar preços personalizados
  const [userData] = await db
    .select({
      id: user.id,
      referredBy: user.referredBy,
    })
    .from(user)
    .where(eq(user.id, session.user.id));

  // Buscar envios e produtos em paralelo
  const [submissionsResult, productsResult] = await Promise.all([
    getUserSubmissions(session.user.id, isAdmin),
    // Se o usuário foi indicado, usar preços personalizados do indicador
    userData?.referredBy
      ? getProductsForUser(session.user.id)
      : getUserProducts(session.user.id),
  ]);

  if (!submissionsResult.success || !submissionsResult.data) {
    return (
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erro ao carregar envios</h1>
          <p className="text-muted-foreground">
            {submissionsResult.error || "Tente novamente mais tarde"}
          </p>
        </div>
      </div>
    );
  }

  if (!productsResult.success || !productsResult.data) {
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
          <h1 className="text-3xl font-bold">Envios de Clientes</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Gerencie todos os envios de clientes da plataforma."
              : "Visualize seus envios e os envios dos seus indicados."}
          </p>
        </div>

        <div className="flex gap-2">
          <CreateSubmissionDialog
            products={productsResult.data}
            userId={session.user.id}
          >
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Novo envio
            </Button>
          </CreateSubmissionDialog>
        </div>
      </div>

      <SubmissionsTable
        submissions={submissionsResult.data as SubmissionData[]}
        userId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
