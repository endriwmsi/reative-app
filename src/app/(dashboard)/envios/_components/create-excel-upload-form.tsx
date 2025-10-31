"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { validateCoupon } from "@/actions/coupon/coupon.action";
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
  onSuccess?: () => void;
}

export default function CreateExcelUploadForm({
  products,
  userId,
  onSuccess,
}: CreateExcelUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [couponValidation, setCouponValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    couponId: string | null;
    discountedPrice: number | null;
    message: string;
  }>({
    isValidating: false,
    isValid: false,
    couponId: null,
    discountedPrice: null,
    message: "",
  });
  const router = useRouter();

  const form = useForm<ExcelUploadFormData>({
    resolver: zodResolver(excelUploadSchema),
    defaultValues: {
      title: "",
      productId: "",
      couponCode: "",
      notes: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Validação de cupom com debounce
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "couponCode" || name === "productId") {
        const couponCode = value.couponCode;
        const productId = value.productId;

        if (!couponCode || !productId) {
          setCouponValidation({
            isValidating: false,
            isValid: false,
            couponId: null,
            discountedPrice: null,
            message: "",
          });
          return;
        }

        const timeoutId = setTimeout(async () => {
          setCouponValidation((prev) => ({ ...prev, isValidating: true }));

          try {
            const result = await validateCoupon({
              code: couponCode,
              productId: parseInt(productId),
              userId,
            });

            if (result.success && result.data) {
              setCouponValidation({
                isValidating: false,
                isValid: true,
                couponId: result.data.id,
                discountedPrice: parseFloat(result.data.finalPrice),
                message: `Cupom válido! Preço unitário com desconto: R$ ${parseFloat(result.data.finalPrice).toFixed(2)} por nome`,
              });
            } else {
              setCouponValidation({
                isValidating: false,
                isValid: false,
                couponId: null,
                discountedPrice: null,
                message: result.error || "Cupom inválido",
              });
            }
          } catch {
            setCouponValidation({
              isValidating: false,
              isValid: false,
              couponId: null,
              discountedPrice: null,
              message: "Erro ao validar cupom",
            });
          }
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, userId]);

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
        couponId: couponValidation.couponId || "",
      });

      if (submissionResult.success) {
        toast.success(submissionResult.message);
        form.reset();
        setSelectedFile(null);

        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/envios");
        }
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
          name="couponCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupom de Desconto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o código do cupom (opcional)"
                  {...field}
                />
              </FormControl>
              {couponValidation.isValidating && (
                <p className="text-sm text-muted-foreground">
                  Validando cupom...
                </p>
              )}
              {couponValidation.message && (
                <p
                  className={`text-sm ${
                    couponValidation.isValid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {couponValidation.message}
                </p>
              )}
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
