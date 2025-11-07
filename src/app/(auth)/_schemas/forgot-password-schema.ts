import z from "zod/v4";
import { getValidDomains } from "@/lib/utils";

export const forgotPasswordSchema = z.object({
  email: z
    .email()
    .min(8, {
      message: "O email deve ter pelo menos 8 caracteres.",
    })
    .refine((email) => getValidDomains().includes(email), {
      message: "O email deve ser de um domínio válido.",
    }),
});
