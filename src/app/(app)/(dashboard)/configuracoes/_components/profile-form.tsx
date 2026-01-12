"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/user/update-profile.action";
import { uploadAvatarAction } from "@/actions/user/upload-avatar.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { authClient, useSession } from "@/lib/auth-client";
import {
  type ProfileFormData,
  profileSchema,
} from "../_schemas/profile-schema";

type ProfileFormProps = {
  defaultValues: ProfileFormData & { image?: string | null };
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <AvatarForm
        defaultImage={defaultValues.image}
        name={defaultValues.name}
      />
      <ProfileDataForm defaultValues={defaultValues} />
    </div>
  );
}

function AvatarForm({
  defaultImage,
  name,
}: {
  defaultImage?: string | null;
  name: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(
    session?.user.image || defaultImage || null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de perfil</CardTitle>
        <CardDescription>Atualize sua foto de perfil.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-md">
            {preview ? (
              <AvatarImage src={preview} alt={name} />
            ) : (
              <AvatarFallback className="rounded-md">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Optimistic update
                const reader = new FileReader();
                reader.onload = () => setPreview(reader.result as string);
                reader.readAsDataURL(file);

                const fd = new FormData();
                fd.append("file", file);

                const toastId = toast.loading("Enviando imagem...");

                try {
                  const res = await uploadAvatarAction(fd);
                  if (res.success) {
                    toast.success("Imagem atualizada com sucesso", {
                      id: toastId,
                    });
                    router.refresh();
                    await authClient.getSession();
                  } else {
                    toast.error(res.error || "Erro ao enviar imagem", {
                      id: toastId,
                    });
                  }
                } catch (error) {
                  toast.error("Erro ao enviar imagem", { id: toastId });
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              <UploadIcon className="mr-2 h-3 w-3" />
              Alterar foto
            </Button>
            {preview && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs"
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileDataForm({
  defaultValues,
}: {
  defaultValues: ProfileFormData;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultValues.name || "",
      email: defaultValues.email || "",
      phone: defaultValues.phone || "",
    },
  });

  async function onSubmit(data: ProfileFormData) {
    setIsSubmitting(true);

    try {
      const result = await updateProfileAction(data);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
        await authClient.getSession();
      } else {
        toast.error(result.error || "Erro ao atualizar perfil");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações pessoais</CardTitle>
        <CardDescription>Atualize suas informações pessoais.</CardDescription>
      </CardHeader>
      <CardContent>
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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
      </CardContent>
    </Card>
  );
}
