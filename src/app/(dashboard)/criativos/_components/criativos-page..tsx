"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Criativos = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="absolute inset-0 z-0">
        {isMobile ? (
          <Image
            src="/assets/images/criativos-img-mob.jpg"
            alt="Mobile Hero"
            fill
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src="/assets/images/criativos-img-desk.jpg"
            alt="Desktop Hero"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Content - Text */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col justify-center space-y-8 p-8 text-foreground md:p-12 lg:p-16">
        <div className="space-y-4 -translate-y-36 md:translate-0">
          <h1 className="text-3xl tracking-tight lg:text-4xl xl:text-5xl">
            Impulsione seu <br className="hidden lg:block" />
            <span className="font-extrabold ">negócio de limpeza de nome</span>{" "}
            com posts prontos, persuasivos e altamente estratégicos!
          </h1>
          <p className="text-lg">
            Tenha acesso a posts prontos só copiar e colar
          </p>
        </div>

        <div>
          <Button
            className="w-full gap-2 md:w-auto bg-blue-500 -translate-y-36 md:translate-0"
            size="lg"
            variant="default"
          >
            <Lock className="h-4 w-4" />
            Disponível apenas para usuários ativos
          </Button>
        </div>
      </div>
    </>
  );
};

export default Criativos;
