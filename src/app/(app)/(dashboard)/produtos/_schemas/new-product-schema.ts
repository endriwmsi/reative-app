import z from "zod/v4";

export const productSchema = z.object({
  name: z.string().min(1, "O nome do produto é obrigatório"),
  price: z.string().min(1, "O preço deve ser um número positivo"),
  category: z.enum(["limpa_nome", "atualizacao_rating", "outro"]),
  description: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
