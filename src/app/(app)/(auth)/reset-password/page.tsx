import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Recuperação de senha",
  description: "Página de recuperação de senha.",
};

interface PageProps {
  searchParams: Promise<{ token: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const token = (await searchParams).token;

  if (!token) redirect("/login");

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-8 py-16">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Reset Password</h1>

        <p className="text-muted-foreground">
          Please enter your new password. Make sure it is at least 6 characters.
        </p>

        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
