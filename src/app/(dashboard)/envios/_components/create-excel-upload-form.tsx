"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createSubmission,
  processExcelFile,
} from "@/actions/submission/submission.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  type ExcelUploadFormData,
  excelUploadSchema,
} from "../_schemas/excel-upload-schema";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  customPrice: string | null;
}

interface CreateExcelUploadFormProps {
  products: Product[];
  userId: string;
  trigger?: React.ReactNode;
}

export default function CreateExcelUploadForm({
  products,
  userId,
}: CreateExcelUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<ExcelUploadFormData>({
    resolver: zodResolver(excelUploadSchema),
    defaultValues: {
      title: "",
      productId: "",
      notes: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ExcelUploadFormData) => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo Excel");
      return;
    }

    try {
      // Primeiro, processa o arquivo Excel
      const result = await processExcelFile(selectedFile);

      if (!result.success || !result.data) {
        toast.error(result.error || "Erro ao processar arquivo");
        return;
      }

      // Depois cria o envio com os dados do Excel
      const submissionResult = await createSubmission(userId, {
        title: data.title,
        productId: parseInt(data.productId),
        clients: result.data,
        notes: data.notes || "",
      });

      if (submissionResult.success) {
        toast.success(submissionResult.message);
        router.refresh();
        form.reset();
        setSelectedFile(null);
      } else {
        toast.error(submissionResult.error);
      }
    } catch {
      toast.error("Erro ao criar envio");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto/Serviço</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{product.name}</span>
                        <Badge variant="outline">
                          R$ {product.customPrice || product.basePrice}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Envio *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Protocolo Janeiro 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações opcionais sobre o envio..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arquivo Excel *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (
                        file &&
                        !file.name.endsWith(".xlsx") &&
                        !file.name.endsWith(".xls")
                      ) {
                        toast.error(
                          "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
                        );
                        return;
                      }
                      field.onChange(file);
                      setSelectedFile(file);
                    }}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                      <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Arquivo Excel com colunas: Nome, Documento, Tipo
                (protocolo/reprotocolo). Opcionais: Email, Telefone, Data,
                Observacoes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Spinner />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Criar Envio Lista
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
