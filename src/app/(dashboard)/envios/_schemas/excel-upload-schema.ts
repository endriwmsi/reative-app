import { z } from "zod";

export const excelUploadSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  productId: z.string().min(1, "Selecione um produto"),
  couponCode: z.string().optional(),
  notes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional(),
  file: z.any().optional(),
});

export type ExcelUploadFormData = z.infer<typeof excelUploadSchema>;
