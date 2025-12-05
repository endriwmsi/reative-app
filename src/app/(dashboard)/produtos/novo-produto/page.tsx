import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import NewProductForm from "../_components/new-product-form";

export const metadata: Metadata = {
  title: "Hub LN - Novo Produto",
  description: "Crie novos produtos de forma fácil e rápida.",
};

const NovoProdutoPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/produtos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Novo Produto</h1>
      </div>

      <NewProductForm />
    </div>
  );
};

export default NovoProdutoPage;
