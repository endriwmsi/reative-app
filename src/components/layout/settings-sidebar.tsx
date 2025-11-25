"use client";

import { motion, type Variants } from "framer-motion";
import { CreditCard, FileText, MapPin, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const sidebarNavItems = [
  {
    title: "Perfil",
    href: "/configuracoes/perfil",
    icon: User,
  },
  {
    title: "Endereço",
    href: "/configuracoes/endereco",
    icon: MapPin,
  },
  {
    title: "Documentos",
    href: "/configuracoes/documentos",
    icon: FileText,
  },
  {
    title: "Assinatura",
    href: "/configuracoes/assinatura",
    icon: CreditCard,
  },
  {
    title: "Segurança",
    href: "/configuracoes/seguranca",
    icon: Shield,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    x: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const hoverVariants: Variants = {
  hover: {
    x: 4,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  initial: {
    x: 0,
  },
};

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 flex-col py-6 pl-4 pr-2 bg-sidebar border-none hidden md:flex">
      <div className="px-2 mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          Configurações
        </h2>
      </div>
      <motion.nav
        className="space-y-0.5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <SidebarMenu>
          {sidebarNavItems.map((item) => (
            <motion.div key={item.href} variants={itemVariants}>
              <motion.div
                variants={hoverVariants}
                initial="initial"
                whileHover="hover"
              >
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-all",
                      pathname === item.href
                        ? "text-sidebar-foreground bg-sidebar-accent shadow-sm border border-sidebar-border"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent",
                    )}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </motion.div>

              {/* <Link
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-all",
                  pathname === item.href
                    ? "text-sidebar-foreground bg-sidebar-accent shadow-sm border border-sidebar-border"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link> */}
            </motion.div>
          ))}
        </SidebarMenu>
      </motion.nav>
    </aside>
  );
}
