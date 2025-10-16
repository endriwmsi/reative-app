import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-passoword-form";

export const metadata: Metadata = {
  title: "Recupere sua senha!",
  description: "Página de recuperação de senha.",
};

const ForgotPasswordPage = () => {
  return (
    <div className="lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Redefinir senha
          </h1>
          <p className="text-muted-foreground text-sm">
            Insira seu e-mail para redefinir sua senha.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
