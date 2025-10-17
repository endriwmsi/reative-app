"use client";

import { Upload, Users } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcelUploadForm from "./create-excel-upload-form";
import CreateSingleClientForm from "./create-single-client-form";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  customPrice: string | null;
}

interface CreateSubmissionDialogProps {
  products: Product[];
  userId: string;
  children: React.ReactNode;
}

export function CreateSubmissionDialog({
  products,
  userId,
  children,
}: CreateSubmissionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Envio</DialogTitle>
          <DialogDescription>
            Escolha o tipo de envio que deseja criar
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lista" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lista" className="gap-2">
              <Upload className="h-4 w-4" />
              Lista (Excel)
            </TabsTrigger>
            <TabsTrigger value="avulso" className="gap-2">
              <Users className="h-4 w-4" />
              Avulso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            <div className="text-muted-foreground text-sm">
              Importe uma lista de clientes através de arquivo Excel (.xlsx)
            </div>
            <ExcelUploadForm products={products} userId={userId} />
          </TabsContent>

          <TabsContent value="avulso" className="space-y-4">
            <div className="text-muted-foreground text-sm">
              Crie um envio para um único cliente
            </div>
            <CreateSingleClientForm
              products={products}
              userId={userId}
              onSuccess={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
