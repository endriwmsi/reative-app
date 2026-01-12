import Link from "next/link";
import type { Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { RegisterFormData } from "../../app/(app)/(auth)/_schemas/register-schemas";

interface Step3ContentProps {
  control: Control<RegisterFormData>;
}

export function Step3Content({ control }: Step3ContentProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="street"
        render={({ field }) => (
          <div className="grid gap-2">
            {/* <FormLabel className="text-white">Rua</FormLabel> */}
            <FormControl>
              <Input
                {...field}
                type="text"
                placeholder="Logradouro"
                className="w-full border-0 bg-primary/10 px-4 py-5"
              />
            </FormControl>
            <FormMessage />
          </div>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={control}
          name="number"
          render={({ field }) => (
            <div className="grid gap-2">
              {/* <FormLabel className="text-white">Número</FormLabel> */}
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Número"
                  className="w-full border-0 bg-primary/10 px-4 py-5"
                />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />

        <FormField
          control={control}
          name="complement"
          render={({ field }) => (
            <div className="grid gap-2">
              {/* <FormLabel className="text-white">Complemento</FormLabel> */}
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Complemento"
                  className="w-full border-0 bg-primary/10 px-4 py-5"
                />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />

        <FormField
          control={control}
          name="neighborhood"
          render={({ field }) => (
            <div className="grid gap-2">
              {/* <FormLabel className="text-white">Bairro</FormLabel> */}
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Bairro"
                  className="w-full border-0 bg-primary/10 px-4 py-5"
                />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <div className="grid gap-2">
              {/* <FormLabel className="text-white">Cidade</FormLabel> */}
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Cidade"
                  className="w-full border-0 bg-primary/10 px-4 py-5"
                />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />

        <FormField
          control={control}
          name="state"
          render={({ field }) => (
            <div className="grid gap-2">
              {/* <FormLabel className="text-white">Estado</FormLabel> */}
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Estado"
                  className="w-full border-0 bg-primary/10 px-4 py-5"
                  maxLength={2}
                />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="cep"
          render={({ field }) => (
            <div className="col-span-2 grid gap-2">
              {/* <FormLabel className="text-white">CEP</FormLabel> */}
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="CEP"
                  className="w-full border-0 bg-primary/10 px-4 py-5"
                  maxLength={9}
                  onChange={(e) => {
                    // Simple CEP mask
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 8) {
                      value = value.replace(/(\d{5})(\d{3})/, "$1-$2");
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

      <Separator className="my-6 bg-zinc-800" />

      <FormField
        control={control}
        name="acceptTerms"
        render={({ field }) => (
          <div className="grid gap-2">
            <FormControl>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label
                  htmlFor="terms"
                  className="cursor-pointer text-sm text-primary/50"
                >
                  Eu aceito os{" "}
                  <Link
                    href="/termos-e-condicoes"
                    className="text-primary underline underline-offset-4 hover:text-gray-300"
                  >
                    Termos & Condições
                  </Link>
                </label>
              </div>
            </FormControl>
            <FormMessage />
          </div>
        )}
      />
    </div>
  );
}
