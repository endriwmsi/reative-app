"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createCleanNameAction,
  updateCleanNameAction,
} from "@/actions/clean-name-action/clean-name-action.action";
import {
  type CleanNameActionInput,
  cleanNameActionSchema,
} from "@/actions/clean-name-action/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CleanNameAction } from "@/db/schema/clean-name-action";

interface CleanNameActionDialogProps {
  children: React.ReactNode;
  action?: CleanNameAction;
}

const statusOptions = [
  "Aguardando baixas",
  "Baixas Iniciadas",
  "Baixas completas",
];

export function CleanNameActionDialog({
  children,
  action,
}: CleanNameActionDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CleanNameActionInput>({
    resolver: zodResolver(cleanNameActionSchema) as any,
    defaultValues: {
      name: action?.name || "",
      startDate: action?.startDate ? new Date(action.startDate) : new Date(),
      endDate: action?.endDate ? new Date(action.endDate) : new Date(),
      isActive: action?.isActive ?? true,
      boaVistaStatus:
        (action?.boaVistaStatus as CleanNameActionInput["boaVistaStatus"]) ||
        "Aguardando baixas",
      spcStatus:
        (action?.spcStatus as CleanNameActionInput["spcStatus"]) ||
        "Aguardando baixas",
      serasaStatus:
        (action?.serasaStatus as CleanNameActionInput["serasaStatus"]) ||
        "Aguardando baixas",
      cenprotSpStatus:
        (action?.cenprotSpStatus as CleanNameActionInput["cenprotSpStatus"]) ||
        "Aguardando baixas",
      cenprotNacionalStatus:
        (action?.cenprotNacionalStatus as CleanNameActionInput["cenprotNacionalStatus"]) ||
        "Aguardando baixas",
      outrosStatus:
        (action?.outrosStatus as CleanNameActionInput["outrosStatus"]) ||
        "Aguardando baixas",
    },
  });

  async function onSubmit(data: CleanNameActionInput) {
    try {
      let result: { success: boolean; message?: string; error?: string };
      if (action) {
        result = await updateCleanNameAction(action.id, data);
      } else {
        result = await createCleanNameAction(data);
      }

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar ação");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action ? "Editar Ação" : "Nova Ação"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fim</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativa</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  "boaVistaStatus",
                  "spcStatus",
                  "serasaStatus",
                  "cenprotSpStatus",
                  "cenprotNacionalStatus",
                  "outrosStatus",
                ] as const
              ).map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control as any}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {fieldName
                          .replace("Status", "")
                          .replace(/([A-Z])/g, " $1")
                          .trim()}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value as string}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
