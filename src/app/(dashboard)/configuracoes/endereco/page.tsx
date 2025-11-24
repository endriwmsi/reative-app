import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "../_components/address-form";

export default async function AddressPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Endereço</h3>
        <p className="text-sm text-muted-foreground">
          Mantenha seu endereço atualizado para entregas e correspondências.
        </p>
      </div>
      <Separator />
      <AddressForm
        defaultValues={{
          street: session.user.street,
          number: session.user.number,
          complement: session.user.complement || "",
          neighborhood: session.user.neighborhood,
          city: session.user.city,
          uf: session.user.uf,
          cep: session.user.cep,
        }}
      />
    </div>
  );
}
