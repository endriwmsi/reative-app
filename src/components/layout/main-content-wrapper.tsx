"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { AnnouncementBanner } from "../announcement-banner";

export function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/configuracoes");

  if (isSettings) {
    return (
      <motion.div
        key="settings"
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-1 h-full overflow-hidden"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <SiteHeader />
      <div className="flex flex-col">
        <AnnouncementBanner
          type="info"
          message="Próxima ação de limpa nome dia 05/12/2025 até 08/12/2025 as 20:00h"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 overflow-auto"
      >
        <div className="@container/main flex flex-1 flex-col gap-2 h-full">
          <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6 px-6">
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
