import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod/v4";
import { signUpEmailAction } from "@/actions/auth/sign-up.action";
import {
  registerSchema,
  step1Schema,
  step2Schema,
  step3Schema,
} from "@/app/(auth)/_schemas/register-schemas";

export function useRegisterForm(referralCode: string) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const formData = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      cpf: "",
      cnpj: "",
      phone: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
      acceptTerms: false,
    },
  });

  const validateCurrentStep = async () => {
    const values = formData.getValues();
    let isValid = false;

    try {
      switch (currentStep) {
        case 1:
          await step1Schema.parseAsync({
            fullname: values.fullname,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
          });
          isValid = true;
          break;
        case 2:
          await step2Schema.parseAsync({
            cpf: values.cpf,
            cnpj: values.cnpj,
            phone: values.phone,
          });
          isValid = true;
          break;
        case 3:
          await step3Schema.parseAsync({
            street: values.street,
            number: values.number,
            complement: values.complement,
            neighborhood: values.neighborhood,
            city: values.city,
            state: values.state,
            cep: values.cep,
          });
          isValid = true;
          break;
      }
    } catch (error) {
      console.log(error);
      await formData.trigger();
      isValid = false;
    }

    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsPending(true);

    console.log(values);

    // Adicionar referralCode aos dados se fornecido
    const submitData = {
      ...values,
      referredBy: referralCode,
    };

    const { error } = await signUpEmailAction(submitData);
    if (error) {
      toast.error(error);
      setIsPending(false);
    } else {
      toast.success(
        "Usuário cadastrado com sucesso. Por favor, verifique seu e-mail para continuar.",
      );
      router.push("/register/success");
    }
  };

  return {
    formData,
    currentStep,
    isPending,
    nextStep,
    prevStep,
    onSubmit,
  };
}
