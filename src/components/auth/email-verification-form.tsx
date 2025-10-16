"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { sendVerificationEmail } from "@/lib/auth-client";

const EmailVerificationForm = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const formData = new FormData(evt.target as HTMLFormElement);
    const email = String(formData.get("email"));

    if (!email) return toast.error("E-mail é obrigatório");

    await sendVerificationEmail({
      email,
      callbackURL: "/verify",
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
          toast.success("E-mail de verificação enviado com sucesso");
          router.push("/verify/success");
        },
      },
    });

    setIsPending(false);
  };

  return (
    <form className="w-full max-w-sm space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          type="email"
          name="email"
          id="email"
          className="border-0 bg-zinc-900 px-4 py-5"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Enviando e-mail de verificação
          </span>
        ) : (
          "Enviar e-mail de verificação"
        )}
      </Button>
    </form>
  );
};

export default EmailVerificationForm;
