"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
import { validateCoupon } from "@/actions/coupon/coupon.action";
import { createSubmission } from "@/actions/submission/submission.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import type { CleanNameAction } from "@/db/schema/clean-name-action";
import { formatCNPJ, formatCPF } from "@/lib/utils";
import { singleClientSchema } from "../_schemas/single-client-schema";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  customPrice: string | null;
}

interface CreateSingleClientFormProps {
  products: Product[];
  userId?: string;
  onSuccess: () => void;
  activeActions?: CleanNameAction[];
}

export default function CreateSingleClientForm({
  products,
  userId,
  onSuccess,
  activeActions,
}: CreateSingleClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState<{
    id: string;
    code: string;
    finalPrice: string;
    discountType: string;
    discountValue: string;
    productName: string;
    originalPrice: string;
    discount: string;
  } | null>(null);

  const form = useForm<z.infer<typeof singleClientSchema>>({
    resolver: zodResolver(singleClientSchema),
    defaultValues: {
      title: "",
      productId: "",
      name: "",
      document: "",
      couponCode: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof singleClientSchema>) => {
    setLoading(true);
    try {
      // Validação adicional para garantir que temos dados válidos do cliente
      const cleanedName = values.name.trim();
      const cleanedDocument = values.document.replace(/\D/g, "");

      if (!cleanedName || cleanedName.length < 2) {
        toast.error("Nome do cliente deve ter pelo menos 2 caracteres");
        return;
      }

      if (
        !cleanedDocument ||
        (cleanedDocument.length !== 11 && cleanedDocument.length !== 14)
      ) {
        toast.error(
          "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
        );
        return;
      }

      const clientData = {
        name: cleanedName,
        document: cleanedDocument,
      };

      // biome-ignore lint/style/noNonNullAssertion: false positive
      const result = await createSubmission(userId!, {
        title: values.title,
        productId: parseInt(values.productId),
        clients: [clientData],
        notes: values.notes || undefined,
        couponId: validatedCoupon?.id, // Passar o ID do cupom validado
      });

      if (result.success) {
        toast.success(result.message);
        form.reset();
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao criar envio");
    } finally {
      setLoading(false);
    }
  };

  const watchedProductId = form.watch("productId");
  const watchedCouponCode = form.watch("couponCode");

  const selectedProduct = products.find(
    (p) => p.id === parseInt(watchedProductId),
  );

  // Preço final considerando cupom válido
  const finalPrice = validatedCoupon
    ? validatedCoupon.finalPrice
    : selectedProduct?.customPrice || selectedProduct?.basePrice || "0";

  // Validar cupom quando código ou produto mudar
  React.useEffect(() => {
    const handleValidateCoupon = async (couponCode: string) => {
      if (!couponCode || !selectedProduct) {
        setValidatedCoupon(null);
        return;
      }

      setValidatingCoupon(true);
      try {
        const result = await validateCoupon({
          code: couponCode,
          productId: selectedProduct.id,
          userId,
        });

        if (result.success && result.data) {
          setValidatedCoupon(result.data);
          toast.success(result.message);
        } else {
          setValidatedCoupon(null);
          toast.error(result.error);
        }
      } catch {
        setValidatedCoupon(null);
        toast.error("Erro ao validar cupom");
      } finally {
        setValidatingCoupon(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (watchedCouponCode && selectedProduct) {
        handleValidateCoupon(watchedCouponCode);
      } else {
        setValidatedCoupon(null);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [watchedCouponCode, selectedProduct, userId]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Envio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma ação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeActions?.map((action) => (
                        <SelectItem key={action.id} value={action.name}>
                          {action.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-2">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
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
            {selectedProduct && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p>
                  <strong>Valor por cliente:</strong> R$ {finalPrice}
                  {validatedCoupon && (
                    <span className="ml-2 text-green-600">
                      (com desconto: R$ {validatedCoupon.originalPrice} → R${" "}
                      {validatedCoupon.finalPrice} por cliente)
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {selectedProduct.description}
                </p>
              </div>
            )}
          </div>

          {/* Campo do Cupom */}
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="couponCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cupom de Desconto (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o código do cupom"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  {validatingCoupon && (
                    <p className="text-sm text-muted-foreground">
                      Validando cupom...
                    </p>
                  )}
                  {validatedCoupon && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="text-green-600 font-medium">
                        ✅ Cupom "{validatedCoupon.code}" aplicado!
                      </p>
                      <p className="text-green-700">
                        Desconto: R$ {validatedCoupon.discount}
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados do Cliente</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome completo do cliente"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite apenas os números"
                        {...field}
                        maxLength={18}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");

                          // Armazena apenas números para validação
                          const formattedValue =
                            value.length >= 14
                              ? formatCNPJ(value)
                              : formatCPF(value);

                          field.onChange(formattedValue);
                        }}
                        onBlur={(e) => {
                          // Ao sair do campo, garantir que apenas números são armazenados para validação
                          const cleanValue = e.target.value.replace(/\D/g, "");
                          const formattedValue =
                            cleanValue.length >= 14
                              ? formatCNPJ(cleanValue)
                              : formatCPF(cleanValue);
                          field.onChange(formattedValue);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground mt-1">
                      {field.value &&
                        field.value.replace(/\D/g, "").length >= 11 && (
                          <span>
                            {field.value.replace(/\D/g, "").length === 11
                              ? "CPF"
                              : "CNPJ"}{" "}
                            -{field.value.replace(/\D/g, "").length} dígitos
                          </span>
                        )}
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações sobre este envio..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Criando Envio..." : "Criar Envio"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
