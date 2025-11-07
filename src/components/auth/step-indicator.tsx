import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: Array<{
    number: number;
    title: string;
    description: string;
  }>;
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step.number < currentStep
                  ? "border-green-600 bg-green-600 text-white"
                  : step.number === currentStep
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-600 text-gray-400"
              }`}
            >
              {step.number < currentStep ? <Check size={16} /> : step.number}
            </div>
            <div className="mt-2 text-center">
              <p
                className={`text-xs font-medium ${step.number <= currentStep ? "text-primary" : "text-primary/60"}`}
              >
                {step.title}
              </p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-4 h-0.5 flex-1 ${step.number < currentStep ? "bg-green-600" : "bg-gray-600"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
