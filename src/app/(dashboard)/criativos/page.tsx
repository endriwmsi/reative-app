import type { Metadata } from "next";
import Criativos from "./_components/criativos-page.";

export const metadata: Metadata = {
  title: "Hub LN - Criativos",
  description:
    "Impulsione seu negócio de limpeza de nome com posts prontos, persuasivos e altamente estratégicos!",
};

const CriativoPage = () => {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center">
      <Criativos />
    </div>
  );
};

export default CriativoPage;
