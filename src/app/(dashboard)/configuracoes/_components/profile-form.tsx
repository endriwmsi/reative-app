"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/user/update-profile.action";
import { uploadAvatarAction } from "@/actions/user/upload-avatar.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type ProfileFormData,
  profileSchema,
} from "../_schemas/profile-schema";

type ProfileFormProps = {
  defaultValues: ProfileFormData;
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(
    defaultValues.image || null,
  );

  async function onSubmit(data: ProfileFormData) {
    const result = await updateProfileAction(data);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="João Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="joao.silva@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(11) 98765-4321"
                  {...field}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 11) value = value.slice(0, 11);

                    if (value.length >= 11) {
                      value = value.replace(
                        /^(\d{2})(\d{5})(\d{4})/,
                        "($1) $2-$3",
                      );
                    } else if (value.length >= 7) {
                      value = value.replace(
                        /^(\d{2})(\d{4})(\d)/,
                        "($1) $2-$3",
                      );
                    } else if (value.length >= 3) {
                      value = value.replace(/^(\d{2})(\d)/, "($1) $2");
                    }

                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Uploader de imagem de perfil */}
        <div className="space-y-2">
          <FormLabel>Foto de perfil</FormLabel>
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              {defaultValues.image && (
                <AvatarImage
                  src={defaultValues.image}
                  alt={defaultValues.name}
                />
              )}
              <AvatarFallback className="rounded-lg">
                {defaultValues.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setPreview(reader.result as string);
                  reader.readAsDataURL(file);

                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await uploadAvatarAction(fd);
                  if (res.success) {
                    form.setValue("image", res.url, { shouldDirty: true });
                    toast.success("Imagem enviada com sucesso");
                  } else {
                    toast.error(res.error);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar imagem
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    form.setValue("image", "");
                  }}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
          <FormMessage />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
