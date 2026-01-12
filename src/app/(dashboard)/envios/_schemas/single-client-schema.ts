import { z } from "zod";
import { isValidCNPJ, isValidCPF } from "@/lib/utils";

export const singleClientSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(100, "O título deve ter no máximo 100 caracteres"),

  productId: z.string().min(1, "Selecione um produto"),

  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
      message: "Nome deve ter pelo menos 2 caracteres após remoção de espaços",
    }),

  document: z
    .string()
    .min(1, "Documento é obrigatório")
    .refine(
      (value) => {
        const cleanDocument = value.replace(/\D/g, "");
        if (cleanDocument.length === 11) {
          return isValidCPF(cleanDocument);
        }
        if (cleanDocument.length === 14) {
          return isValidCNPJ(cleanDocument);
        }
        return false;
      },
      {
        message: "Documento deve ser um CPF ou CNPJ válido",
      },
    ),

  couponCode: z.string().optional().or(z.literal("")),

  notes: z
    .string()
    .max(500, "As observações devem ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type SingleClientFormData = z.infer<typeof singleClientSchema>;
