import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isPending: boolean;
  acceptTerms: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  isPending,
  acceptTerms,
  onPrevious,
  onNext,
}: NavigationButtonsProps) {
  return (
    <div className="mt-6 flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center space-x-2"
      >
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </Button>

      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={onNext}
          className="text-primary flex items-center space-x-2"
          variant="secondary"
        >
          <span>Próximo</span>
          <ChevronRight size={16} />
        </Button>
      ) : (
        <Button
          type="submit"
          className="text-primary"
          variant="secondary"
          disabled={isPending || !acceptTerms}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Criando conta...
            </span>
          ) : (
            "Criar conta"
          )}
        </Button>
      )}
    </div>
  );
}
