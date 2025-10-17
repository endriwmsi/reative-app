import { z } from "zod";

export const singleClientSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(100, "O título deve ter no máximo 100 caracteres"),

  productId: z.string().min(1, "Selecione um produto"),

  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),

  document: z
    .string()
    .min(11, "Documento deve ter pelo menos 11 dígitos")
    .max(14, "Documento deve ter no máximo 14 dígitos"),

  notes: z
    .string()
    .max(500, "As observações devem ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type SingleClientFormData = z.infer<typeof singleClientSchema>;
