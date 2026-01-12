import { UserIcon } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileForm } from "../_components/profile-form";

export const metadata: Metadata = {
  title: "Hub LN - Informações pessoais",
  description: "Detalhes básicos sobre sua conta.",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2 justify-center">
      <div className="flex space-x-3 mb-10">
        <div className="bg-secondary p-3 rounded-md flex items-center justify-center">
          <UserIcon className="h-6 w-6" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-medium">Informações básicas</h3>
          <p className="text-sm text-muted-foreground">
            Detalhes básicos sobre sua conta.
          </p>
        </div>
      </div>

      <ProfileForm
        defaultValues={{
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
          image: session.user.image || "",
        }}
      />
    </div>
  );
}
