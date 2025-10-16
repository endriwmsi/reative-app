import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReferralCard } from "./_components/referral-card";
import { SettingsHeader } from "./_components/settings-header";
import { SettingsTabs } from "./_components/settings-tabs";

export const metadata = {
  title: "Configurações",
  description: "Gerencie suas informações pessoais e configurações de conta",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8">
      <SettingsHeader
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />

      {/* Cartão de Indicação */}
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <ReferralCard referralCode={session.user.referralCode} />
      </div>

      <SettingsTabs
        profileData={{
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
          image: session.user.image || "",
        }}
        addressData={{
          street: session.user.street,
          number: session.user.number,
          complement: session.user.complement || "",
          neighborhood: session.user.neighborhood,
          city: session.user.city,
          uf: session.user.uf,
          cep: session.user.cep,
        }}
        documentsData={{
          cpf: session.user.cpf || "",
          cnpj: session.user.cnpj || "",
        }}
      />
    </div>
  );
}
