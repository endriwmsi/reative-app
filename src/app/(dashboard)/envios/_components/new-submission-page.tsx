"use client";

import { ArrowLeft, Upload, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcelUploadForm from "../_components/create-excel-upload-form";
import CreateSingleClientForm from "../_components/create-single-client-form";
import "@/types/auth";

interface NewSubmissionPageProps {
  userId: string;
  products: {
    id: number;
    name: string;
    description: string;
    basePrice: string;
    category: string;
    customPrice: string | null;
  }[];
}

export default function NewSubmissionPage({
  products,
  userId,
}: NewSubmissionPageProps) {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/envios">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Novo Envio</h1>
          <p className="text-muted-foreground">
            Escolha o tipo de envio que deseja criar
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Envio</CardTitle>
          <CardDescription>
            Selecione como deseja enviar seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lista" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lista" className="gap-2">
                <Upload className="h-4 w-4" />
                Lista (Excel)
              </TabsTrigger>
              <TabsTrigger value="avulso" className="gap-2">
                <Users className="h-4 w-4" />
                Cliente Avulso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lista" className="space-y-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Envio por Lista (Excel)
                </h3>
                <p className="text-blue-700 text-sm">
                  Importe uma lista de clientes através de arquivo Excel (.xlsx
                  ou .xls). Ideal para envios em massa com múltiplos clientes.
                </p>
              </div>
              <ExcelUploadForm
                products={products}
                userId={userId}
                onSuccess={() => {
                  window.location.href = "/envios";
                }}
              />
            </TabsContent>

            <TabsContent value="avulso" className="space-y-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">
                  Cliente Avulso
                </h3>
                <p className="text-green-700 text-sm">
                  Crie um envio para um único cliente preenchendo os dados
                  manualmente. Ideal para envios individuais.
                </p>
              </div>
              <CreateSingleClientForm
                products={products}
                userId={userId}
                onSuccess={() => {
                  window.location.href = "/envios";
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
