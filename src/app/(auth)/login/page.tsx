import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Faça login na plataforma",
  description: "Página de Login da plataforma",
};

const LoginPage = () => {
  return (
    <div className="flex flex-col">
      <LoginForm />

      {/* Registration Link */}
      <div className="mt-6 w-full text-center text-sm">
        <span className="text-gray-400">Ainda não tem uma conta? </span>
        <Link
          href="/register"
          className="text-white underline underline-offset-4 hover:text-gray-300"
        >
          Crie uma aqui
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
