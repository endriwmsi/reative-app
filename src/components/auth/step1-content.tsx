import type { Control } from "react-hook-form";
import { FormControl, FormField, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { RegisterFormData } from "../../app/(app)/(auth)/_schemas/register-schemas";

interface Step1ContentProps {
  control: Control<RegisterFormData>;
}

export function Step1Content({ control }: Step1ContentProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="fullname"
        render={({ field }) => (
          <div className="grid gap-2">
            <FormControl>
              <Input
                {...field}
                id="fullname"
                type="text"
                placeholder="Nome completo"
                className="w-full border-0 bg-primary/10 px-4 py-5"
                autoComplete="name"
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <div className="grid gap-2">
            <FormControl>
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                className="w-full border-0 bg-primary/10 px-4 py-5"
                autoComplete="email"
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <div className="grid gap-2">
            <FormControl>
              <PasswordInput
                {...field}
                id="password"
                placeholder="Senha"
                className="border-0 bg-primary/10 px-4 py-5"
                autoComplete="new-password"
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />

      <FormField
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <div className="grid gap-2">
            <FormControl>
              <PasswordInput
                {...field}
                id="password-confirm"
                placeholder="Confirme sua senha"
                className="border-0 bg-primary/10 px-4 py-5"
                autoComplete="new-password"
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />
    </div>
  );
}
