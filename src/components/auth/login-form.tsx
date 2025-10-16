"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
import { signInEmailAction } from "@/actions/auth/sign-in.action";
import { loginSchema } from "@/app/(auth)/_schemas/login-schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState<boolean>(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsPending(true);

    try {
      const { error } = await signInEmailAction(values);

      if (error) {
        toast.error(error);
        setIsPending(false);
        return;
      }

      toast.success("Sessão iniciada com sucesso. Seja bem-vindo de volta!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Ocorreu um erro ao tentar fazer login.");
      setIsPending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-9">
        <h1 className="mb-2 text-2xl font-bold text-white">Entrar</h1>
        <p className="text-gray-400">
          Acesse sua conta e tenha acesso a todos os benefícios
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <div className="grid gap-1">
                  <FormControl>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="nome@exemplo.com"
                      className="text-primary w-full border-0 bg-zinc-900 px-4 py-5"
                      autoComplete="email"
                      disabled={isPending}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <div className="grid gap-1">
                  <FormControl>
                    <PasswordInput
                      {...field}
                      id="password"
                      placeholder="********"
                      className="border-0 bg-zinc-900 px-4 py-5"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* <Checkbox
                  id="keepSignedIn"
                  checked={keepSignedIn}
                  onCheckedChange={(checked) =>
                    setKeepSignedIn(checked === true)
                  }
                /> */}
                <label
                  htmlFor="keepSignedIn"
                  className="cursor-pointer text-sm text-gray-400"
                >
                  Mantenha-me conectado
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="inline-block text-sm text-gray-400 underline-offset-4 hover:text-white hover:underline"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            <Button
              type="submit"
              className="text-primary w-full"
              variant="secondary"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
