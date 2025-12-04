"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { createCapitalGiro } from "@/actions/capital-giro/capital-giro.action";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { formatCNPJ, formatCPF } from "@/lib/utils";

const solicitacaoFormSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
    email: z.email("Email inválido"),
    estadoCivil: z
      .string()
      .min(2, "Estado Civíl deve ter pelo menos 2 caracteres"),
    cpf: z.string().min(11, "Documento deve ter pelo menos 11 caracteres"),
    enderecoPessoa: z
      .string()
      .min(5, "Endereço deve ter pelo menos 5 caracteres"),
    cidadePessoa: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
    estadoPessoa: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),

    razaoSocial: z
      .string()
      .min(2, "Razão Social deve ter pelo menos 2 caracteres"),
    cnpj: z.string().min(18, "Documento deve ter pelo menos 18 caracteres"),
    faturamento: z
      .string()
      .min(5, "Faturamento deve ter pelo menos 5 caracteres"),
    enderecoEmpresa: z
      .string()
      .min(5, "Endereço deve ter pelo menos 5 caracteres"),
    cidadeEmpresa: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
    estadoEmpresa: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
    temRestricao: z.string().min(1, "Selecione uma opção"),
    valorRestricao: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.temRestricao === "sim" &&
      (!data.valorRestricao || data.valorRestricao.length < 3)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o valor da restrição",
        path: ["valorRestricao"],
      });
    }
  });

export type SolicitacaoFormValues = z.infer<typeof solicitacaoFormSchema>;

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2")
    .slice(0, 15);
};

const formatCurrency = (value: string) => {
  const numericValue = value.replace(/\D/g, "");
  const floatValue = parseFloat(numericValue) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isNaN(floatValue) ? 0 : floatValue);
};

const SolicitacaoForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof solicitacaoFormSchema>>({
    resolver: zodResolver(solicitacaoFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      cpf: "",
      enderecoPessoa: "",
      cidadePessoa: "",
      estadoPessoa: "",
      estadoCivil: "",

      razaoSocial: "",
      cnpj: "",
      faturamento: "",
      enderecoEmpresa: "",
      cidadeEmpresa: "",
      estadoEmpresa: "",
      temRestricao: "",
      valorRestricao: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof solicitacaoFormSchema>) => {
    setLoading(true);
    try {
      const result = await createCapitalGiro(values);
      if (result.success) {
        toast.success("Solicitação enviada com sucesso!");
        router.push("/solicitacoes-capital-giro");
      } else {
        toast.error(result.error || "Erro ao criar envio");
      }
    } catch {
      toast.error("Erro ao criar envio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(formatCPF(e.target.value));
                      }}
                      maxLength={14}
                    />
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
                    <Input
                      type="email"
                      placeholder="exemplo@email.com"
                      {...field}
                    />
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
                      placeholder="(00) 00000-0000"
                      {...field}
                      onChange={(e) => {
                        field.onChange(formatPhone(e.target.value));
                      }}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estadoCivil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o estado civil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full">
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="uniao_estavel">
                        União Estável
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enderecoPessoa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Residencial</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cidadePessoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estadoPessoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center w-full justify-between gap-2">
              <FormField
                control={form.control}
                name="temRestricao"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel className="text-xs">
                      Possui restrição CPF/CNPJ?
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("temRestricao") === "sim" && (
                <FormField
                  control={form.control}
                  name="valorRestricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Restrição</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(formatCurrency(e.target.value));
                          }}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados da Empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="razaoSocial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Razão Social Ltda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00.000.000/0000-00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(formatCNPJ(e.target.value));
                      }}
                      maxLength={18}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="faturamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faturamento Mensal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R$ 0,00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(formatCurrency(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enderecoEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Comercial</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cidadeEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estadoEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            O prazo para conclusão da análise é de 5 dias úteis.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default SolicitacaoForm;
