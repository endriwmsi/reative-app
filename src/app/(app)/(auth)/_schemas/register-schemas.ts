import z from "zod/v4";

// Schema para validação por etapas
export const step1Schema = z
  .object({
    fullname: z.string().min(2, {
      message: "O Nome deve ter pelo menos 2 caracteres.",
    }),
    email: z.email({
      message: "Você deve fornecer um e-mail válido.",
    }),
    password: z.string().min(8, {
      message: "A senha deve ter pelo menos 8 caracteres.",
    }),
    confirmPassword: z.string().min(8, {
      message: "A confirmação da senha deve ter pelo menos 8 caracteres.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas devem ser iguais.",
    path: ["confirmPassword"],
  });

export const step2Schema = z.object({
  cpf: z
    .string()
    .min(14, { message: "CPF é obrigatório e deve estar completo" }),
  cnpj: z
    .string()
    .min(18, { message: "CNPJ é obrigatório e deve estar completo" }),
  phone: z
    .string()
    .min(13, { message: "Telefone é obrigatório e deve estar completo" }),
});

export const step3Schema = z.object({
  street: z.string().min(1, { message: "Rua é obrigatória" }),
  number: z.string().min(1, { message: "Número é obrigatório" }),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, { message: "Bairro é obrigatório" }),
  city: z.string().min(1, { message: "Cidade é obrigatória" }),
  state: z.string().min(2, { message: "Estado deve ter 2 caracteres" }),
  zipCode: z.string().min(9, { message: "CEP deve estar completo" }),
});

export const registerSchema = z
  .object({
    // Etapa 1
    fullname: z.string().min(2, {
      message: "O Nome deve ter pelo menos 2 caracteres.",
    }),
    email: z.email({
      message: "Você deve fornecer um e-mail válido.",
    }),
    password: z.string().min(8, {
      message: "A senha deve ter pelo menos 8 caracteres.",
    }),
    confirmPassword: z.string().min(8, {
      message: "A confirmação da senha deve ter pelo menos 8 caracteres.",
    }),
    // Etapa 2
    cpf: z
      .string()
      .min(14, { message: "CPF é obrigatório e deve estar completo" }),
    cnpj: z
      .string()
      .min(18, { message: "CNPJ é obrigatório e deve estar completo" }),
    phone: z
      .string()
      .min(13, { message: "Telefone é obrigatório e deve estar completo" }),
    // Etapa 3
    street: z.string().min(1, { message: "Rua é obrigatória" }),
    number: z.string().min(1, { message: "Número é obrigatório" }),
    complement: z.string().min(1, { message: "Complemento é obrigatório" }),
    neighborhood: z.string().min(1, { message: "Bairro é obrigatório" }),
    city: z.string().min(1, { message: "Cidade é obrigatória" }),
    state: z.string().min(2, { message: "Estado deve ter 2 caracteres" }),
    cep: z.string().min(9, { message: "CEP deve estar completo" }),
    // Termos
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Você deve aceitar os termos e condições.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas devem ser iguais.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
