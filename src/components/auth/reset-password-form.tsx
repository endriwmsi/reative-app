"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword } from "@/lib/auth-client";
import { Spinner } from "../ui/spinner";

interface ResetPasswordFormProps {
  token: string;
}

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const formData = new FormData(evt.currentTarget);

    const password = String(formData.get("password"));
    if (!password) return toast.error("Por favor, insira sua senha.");

    const confirmPassword = String(formData.get("confirmPassword"));

    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    await resetPassword({
      newPassword: password,
      token,
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("Senha redefinida com sucesso.");
          router.push("/login");
        },
      },
    });
  }

  return (
    <form className="w-full max-w-sm space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <PasswordInput id="password" name="password" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" />
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Redefinindo senha
          </span>
        ) : (
          "Redefinir senha"
        )}
      </Button>
    </form>
  );
};
