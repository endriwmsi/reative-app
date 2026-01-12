import z from "zod/v4";

export const forgotPasswordSchema = z.object({
  email: z.email().min(8, {
    message: "O email deve ter pelo menos 8 caracteres.",
  }),
});
