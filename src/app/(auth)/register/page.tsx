import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registre-se na plataforma",
  description: "Página de registro da plataforma",
};

interface RegisterPageProps {
  searchParams: Promise<{ ref?: string }>;
}

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  const params = await searchParams;
  const referralCode = params.ref || null;

  return (
    <div className="flex flex-col">
      <RegisterForm referralCode={referralCode} />

      {/* Registration Link */}
      <div className="mt-6 w-full text-center text-sm">
        <span className="text-gray-400">Já tem uma conta? </span>
        <Link
          href="/login"
          className="text-white underline underline-offset-4 hover:text-gray-300"
        >
          Entre agora
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
