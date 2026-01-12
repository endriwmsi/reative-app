import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  content: z.string().min(1, "O conteúdo é obrigatório"),
  active: z.boolean(),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;
