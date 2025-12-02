"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function WhatsAppButton() {
  // Número de telefone para suporte (substitua pelo número real)
  const phoneNumber = "5511988771389";
  const message = "Olá! Preciso de ajuda com a plataforma.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);

    const interval = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }, 30000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="relative mr-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-lg dark:bg-gray-800 dark:text-white"
          >
            Precisa de ajuda?
            {/* Triângulo do balão */}
            <div className="absolute -bottom-1 right-4 h-3 w-3 rotate-45 bg-white dark:bg-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>

      <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 hover:bg-[#128C7E] md:h-14 md:w-14"
          aria-label="Falar no WhatsApp"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <WhatsAppIcon className="h-6 w-6 text-white md:h-8 md:w-8" />
        </Button>
      </Link>
    </div>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.304-5.235c0-5.421 4.409-9.824 9.824-9.824 2.63 0 5.108 1.021 6.969 2.881 1.859 1.86 2.88 4.338 2.88 6.966a9.88 9.88 0 01-9.822 9.824m12.822-9.824c0-7.078-5.756-12.835-12.835-12.835-3.428 0-6.653 1.334-9.076 3.757C1.334 6.18 0 9.405 0 12.835c0 2.262.588 4.467 1.706 6.408L0 24.835l5.724-1.502c1.87 1.02 3.982 1.558 6.098 1.558 7.078 0 12.835-5.757 12.835-12.835z" />
    </svg>
  );
}
