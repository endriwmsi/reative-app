"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
  type DocumentFormData,
  documentSchema,
} from "../_schemas/profile-schema";

type DocumentsFormProps = {
  defaultValues: DocumentFormData;
};

export function DocumentsForm({ defaultValues }: DocumentsFormProps) {
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input
                  placeholder="123.456.789-00"
                  {...field}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-muted"
                  title="O CPF não pode ser alterado após o registro"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                O CPF não pode ser alterado após o registro
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  placeholder="12.345.678/0001-00"
                  {...field}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-muted"
                  title="O CNPJ não pode ser alterado após o registro"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                O CNPJ não pode ser alterado após o registro
              </p>
            </FormItem>
          )}
        />

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            ⚠️ <strong>Atenção:</strong> Os documentos CPF e CNPJ não podem ser
            alterados após o registro por questões de segurança.
          </p>
        </div>
      </form>
    </Form>
  );
}
