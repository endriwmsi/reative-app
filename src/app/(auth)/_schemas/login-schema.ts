import z from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Você deve inserir um e-mail válido."),
  password: z.string().min(8, {
    message: "A senha deve ter pelo menos 8 caracteres.",
  }),
});

export type loginInFormData = z.infer<typeof loginSchema>;
