import type { Control } from "react-hook-form";
import { FormControl, FormField, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCNPJ, formatCPF } from "@/lib/utils";
import type { RegisterFormData } from "../../app/(auth)/_schemas/register-schemas";

interface Step2ContentProps {
  control: Control<RegisterFormData>;
}

export function Step2Content({ control }: Step2ContentProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="cpf"
        render={({ field }) => (
          <div className="grid gap-2">
            {/* <FormLabel className="text-white">CPF</FormLabel> */}
            <FormControl>
              <Input
                {...field}
                type="text"
                placeholder="CPF"
                className="text-secondary w-full border-0 bg-zinc-900 px-4 py-5"
                maxLength={14}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 11) {
                    field.onChange(formatCPF(value));
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />

      <FormField
        control={control}
        name="cnpj"
        render={({ field }) => (
          <div className="grid gap-2">
            {/* <FormLabel className="text-white">CNPJ</FormLabel> */}
            <FormControl>
              <Input
                {...field}
                type="text"
                placeholder="CNPJ"
                className="text-secondary w-full border-0 bg-zinc-900 px-4 py-5"
                maxLength={18}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 14) {
                    field.onChange(formatCNPJ(value));
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />

      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <div className="grid gap-2">
            {/* <FormLabel className="text-white">Telefone</FormLabel> */}
            <FormControl>
              <Input
                {...field}
                type="tel"
                placeholder="Telefone"
                className="text-secondary w-full border-0 bg-zinc-900 px-4 py-5"
                maxLength={15}
                onChange={(e) => {
                  // Simple phone mask
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 11) {
                    value = value.replace(
                      /(\d{2})(\d{5})(\d{4})/,
                      "($1) $2-$3",
                    );
                    field.onChange(value);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />
    </div>
  );
}
