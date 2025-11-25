"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { SettingsMobileDock } from "@/components/layout/settings-mobile-dock";
import { SettingsSidebar } from "@/components/layout/settings-sidebar";
import { SiteHeader } from "@/components/layout/site-header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-sidebar">
      <SettingsSidebar />
      <div className="flex-1 py-2 pr-2 pl-0 flex flex-col">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="w-full h-full bg-background rounded-xl border border-sidebar-border shadow-sm flex flex-col overflow-hidden"
        >
          <SiteHeader />
          <div className="flex-1 overflow-auto p-8 pb-24 md:pb-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
        <SettingsMobileDock />
      </div>
    </div>
  );
}
