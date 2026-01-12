"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/actions/announcement/announcement.action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type AnnouncementFormData,
  announcementSchema,
} from "../_schemas/announcement-schema";

interface AnnouncementFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    active: boolean;
  };
  onSuccess?: () => void;
}

export function AnnouncementForm({
  initialData,
  onSuccess,
}: AnnouncementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      active: initialData?.active ?? true,
    },
  });

  async function onSubmit(values: AnnouncementFormData) {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateAnnouncement(initialData.id, values);
        toast.success("Aviso atualizado com sucesso!");
      } else {
        await createAnnouncement(values);
        toast.success("Aviso criado com sucesso!");
      }
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao salvar aviso");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título do aviso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conteúdo do aviso"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Se desativado, o aviso não será exibido para os usuários.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
