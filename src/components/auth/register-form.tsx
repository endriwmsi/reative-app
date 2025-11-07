"use client";

import { Form } from "@/components/ui/form";
import { useRegisterForm } from "@/hooks/use-register-form";
import { NavigationButtons } from "./navigation-buttons";
import { StepIndicator } from "./step-indicator";
import { Step1Content } from "./step1-content";
import { Step2Content } from "./step2-content";
import { Step3Content } from "./step3-content";

// Configuração das etapas
const steps = [
  { number: 1, title: "Dados Básicos", description: "Nome, email e senha" },
  { number: 2, title: "Documentos", description: "CPF, CNPJ e telefone" },
  { number: 3, title: "Endereço", description: "Endereço completo" },
];

interface RegisterFormProps {
  referralCode: string | null;
}

export function RegisterForm({ referralCode }: RegisterFormProps) {
  const { formData, currentStep, isPending, nextStep, prevStep, onSubmit } =
    useRegisterForm(referralCode);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Content control={formData.control} />;
      case 2:
        return <Step2Content control={formData.control} />;
      case 3:
        return <Step3Content control={formData.control} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-9">
        <h1 className="mb-2 text-2xl font-bold text-primary">Criar conta</h1>
        <p className="text-primary/50">
          Crie sua conta e tenha acesso a todos os benefícios
        </p>
      </div>

      <StepIndicator currentStep={currentStep} steps={steps} />

      <Form {...formData}>
        <form onSubmit={formData.handleSubmit(onSubmit)} className="w-full">
          {renderStepContent()}

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={steps.length}
            isPending={isPending}
            acceptTerms={formData.watch("acceptTerms")}
            onPrevious={prevStep}
            onNext={nextStep}
          />
        </form>
      </Form>
    </div>
  );
}
