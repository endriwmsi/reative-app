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
      <div className="flex-1 flex flex-col md:py-2 md:pr-2 md:pl-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="w-full h-full bg-background md:rounded-xl md:border md:border-sidebar-border md:shadow-sm flex flex-col overflow-hidden"
        >
          <SiteHeader />
          <div className="flex-1 p-4 pb-24 md:p-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
              className="max-w-2xl mx-auto overflow-hidden"
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
