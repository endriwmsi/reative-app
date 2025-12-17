import { z } from "zod";

export const actionStatusEnum = z.enum([
  "Aguardando baixas",
  "Baixas Iniciadas",
  "Baixas completas",
]);

export const cleanNameActionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(true),
  boaVistaStatus: actionStatusEnum,
  spcStatus: actionStatusEnum,
  serasaStatus: actionStatusEnum,
  cenprotSpStatus: actionStatusEnum,
  cenprotNacionalStatus: actionStatusEnum,
  outrosStatus: actionStatusEnum,
});

export type CleanNameActionInput = z.infer<typeof cleanNameActionSchema>;
