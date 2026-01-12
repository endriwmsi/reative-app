"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
import { forgotPasswordSchema } from "@/app/(app)/(auth)/_schemas/forgot-password-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { requestPasswordReset } from "@/lib/auth-client";
import { Form, FormControl, FormField, FormMessage } from "../ui/form";
// import { Icons } from "../../../../components/icons";

export const ForgotPasswordForm = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function handleSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsPending(true);

    try {
      await requestPasswordReset({
        email: values.email,
        redirectTo: "/reset-password",
        fetchOptions: {
          onRequest: () => {
            setIsPending(true);
          },
          onResponse: () => {
            setIsPending(false);
          },
          onError: (ctx: { error: { message: string } }) => {
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success("Link de redefinição enviado para seu e-mail.");
            router.push("/forgot-password/success");
          },
        },
      });
    } catch (error) {
      toast.error("Erro ao enviar o link de redefinição de senha.");
      console.error("Forgot password error:", error);
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <FormControl>
                <Input
                  id="email"
                  {...field}
                  className="text-primary border-0 bg-zinc-900 px-4 py-5"
                  placeholder="nome@exemplo.com"
                  autoComplete="email"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />

        <Button
          variant="secondary"
          className="w-full"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Enviando link de redefinição
            </span>
          ) : (
            "Enviar link de redefinição"
          )}
        </Button>
      </form>
    </Form>
  );
};
