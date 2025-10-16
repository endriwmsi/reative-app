// import { Icons } from "@/components/icons";

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sucesso!",
  description: "Página de sucesso de cadastro.",
};

const SuccessPage = () => {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col items-center space-y-2 text-center">
        {/* <Icons.logo className="h-10 w-10" /> */}
        <p className="text-muted-foreground text-sm">
          Tudo pronto! Você registrou-se com sucesso. Por favor, verifique seu
          e-mail para continuar.
        </p>

        <Link className="mt-4 mb-10" href="/login">
          <Button variant="secondary">Voltar para o login</Button>
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;
