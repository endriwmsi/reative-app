"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
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
}

export default function CreateSingleClientForm({
  products,
  userId,
  onSuccess,
}: CreateSingleClientFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof singleClientSchema>>({
    resolver: zodResolver(singleClientSchema),
    defaultValues: {
      title: "",
      productId: "",
      name: "",
      document: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof singleClientSchema>) => {
    setLoading(true);
    try {
      const clientData = {
        name: values.name,
        document: values.document,
      };

      // biome-ignore lint/style/noNonNullAssertion: false positive
      const result = await createSubmission(userId!, {
        title: values.title,
        productId: parseInt(values.productId),
        clients: [clientData],
        notes: values.notes || undefined,
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
  const selectedProduct = products.find(
    (p) => p.id === parseInt(watchedProductId),
  );
  const productPrice =
    selectedProduct?.customPrice || selectedProduct?.basePrice || "0";

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
                  <FormControl>
                    <Input
                      placeholder="Ex: Cliente João Silva - Limpa Nome"
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
                  <strong>Valor:</strong> R$ {productPrice}
                </p>
                <p className="text-muted-foreground">
                  {selectedProduct.description}
                </p>
              </div>
            )}
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

                          if (value.length >= 14) {
                            field.onChange(formatCNPJ(value));
                          } else {
                            field.onChange(formatCPF(value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
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
