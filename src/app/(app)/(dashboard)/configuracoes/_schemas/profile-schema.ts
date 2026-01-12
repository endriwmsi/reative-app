import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  email: z.email("Email inválido"),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Formato: (XX) XXXXX-XXXX"),
});

export const addressSchema = z.object({
  street: z
    .string()
    .min(3, "Rua deve ter no mínimo 3 caracteres")
    .max(200, "Rua deve ter no máximo 200 caracteres"),
  number: z
    .string()
    .min(1, "Número é obrigatório")
    .max(10, "Número deve ter no máximo 10 caracteres"),
  complement: z.string().max(100, "Complemento muito longo").optional(),
  neighborhood: z
    .string()
    .min(3, "Bairro deve ter no mínimo 3 caracteres")
    .max(100, "Bairro deve ter no máximo 100 caracteres"),
  city: z
    .string()
    .min(3, "Cidade deve ter no mínimo 3 caracteres")
    .max(100, "Cidade deve ter no máximo 100 caracteres"),
  uf: z
    .string()
    .length(2, "UF deve ter 2 caracteres")
    .regex(/^[A-Z]{2}$/, "UF inválida"),
  cep: z
    .string()
    .regex(/^\d{5}-\d{3}$/, "Formato: XXXXX-XXX")
    .length(9, "CEP deve ter 9 caracteres"),
});

export const documentSchema = z
  .object({
    cpf: z
      .string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato: XXX.XXX.XXX-XX")
      .optional()
      .or(z.literal("")),
    cnpj: z
      .string()
      .regex(
        /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
        "Formato: XX.XXX.XXX/XXXX-XX",
      )
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.cpf || data.cnpj, {
    message: "É necessário informar CPF ou CNPJ",
    path: ["cpf"],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type DocumentFormData = z.infer<typeof documentSchema>;
