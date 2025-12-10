import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubscriptionData } from "@/actions/billing/get-subscription-data.action";
import { getCreativesAction } from "@/actions/creative/creative.action";
import { auth } from "@/auth";
import Criativos from "./_components/criativos-page";

export const metadata: Metadata = {
  title: "Hub LN - Criativos",
  description:
    "Impulsione seu negócio de limpeza de nome com posts prontos, persuasivos e altamente estratégicos!",
};

const CriativoPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return redirect("/login");

  const creatives = await getCreativesAction();
  const isAdmin = session?.user?.role === "admin" || false;

  const subscriptionData = await getSubscriptionData(session.user.id);
  const hasAccess = isAdmin || subscriptionData.status === "active";

  return (
    <div className="container mx-auto p-2 lg:p-6 space-y-6">
      <Criativos
        creatives={creatives}
        isAdmin={isAdmin}
        hasAccess={hasAccess}
      />
    </div>
  );
};

export default CriativoPage;
