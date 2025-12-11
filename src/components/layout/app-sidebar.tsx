"use client";

import {
  IconAlertCircle,
  IconDashboard,
  IconImageInPicture,
  IconMoneybag,
  IconNetwork,
  IconPackage,
  IconSend,
  IconSettings,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import NavAdmin from "./nav-admin";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

const headerVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const footerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: 0.6,
    },
  },
};

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Produtos",
      url: "/produtos",
      icon: IconPackage,
    },
    {
      title: "Envios",
      url: "/envios",
      icon: IconSend,
    },
    {
      title: "Cupons",
      url: "/cupons",
      icon: IconTicket,
    },
    {
      title: "Capital de Giro",
      url: "/solicitacoes-capital-giro",
      icon: IconMoneybag,
    },
    {
      title: "Indicações",
      url: "/indicacoes",
      icon: IconNetwork,
    },
    {
      title: "Criativos",
      url: "/criativos",
      icon: IconImageInPicture,
    },
    // {
    //   title: "Gestão Financeira",
    //   url: "#",
    //   icon: IconCreditCard,
    //   items: [
    //     {
    //       title: "Transações",
    //       url: "/dashboard/gestao-financeira",
    //     },
    //     {
    //       title: "Vendas",
    //       url: "/vendas",
    //     },
    //     {
    //       title: "Mensalidades",
    //       url: "/mensalidades",
    //     },
    //     {
    //       title: "Inadimplência",
    //       url: "/inadimplencia",
    //     },
    //   ],
    // },
    // {
    //   title: "Serviços e Produtos",
    //   url: "#",
    //   icon: IconShoppingCart,
    //   items: [
    //     {
    //       title: "Limpa Nome",
    //       url: "/limpa-nome",
    //     },
    //     {
    //       title: "CNH",
    //       url: "/cnh",
    //     },
    //     {
    //       title: "Rating PF",
    //       url: "/rating-pf",
    //     },
    //     {
    //       title: "Rating PJ",
    //       url: "/rating-pj",
    //     },
    //     {
    //       title: "Jus-Brasil e Escavador",
    //       url: "/jus-brasil",
    //     },
    //     {
    //       title: "Bacen",
    //       url: "/bacen",
    //     },
    //   ],
    // },
    // {
    //   title: "Consultas",
    //   url: "#",
    //   icon: IconEye,
    //   items: [
    //     {
    //       title: "Comprar Consultas",
    //       url: "/comprar-consultas",
    //     },
    //     {
    //       title: "Minhas Consultas",
    //       url: "/minhas-consultas",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: IconSettings,
    },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
  admin: [
    {
      name: "Usuários",
      url: "/usuarios",
      icon: IconUsers,
    },
    {
      name: "Avisos",
      url: "/avisos",
      icon: IconAlertCircle,
    },
    // {
    //   name: "Word Assistant",
    //   url: "#",
    //   icon: IconFileWord,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const { data: session } = authClient.useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <Link href="/dashboard">
            <Logo variant={state === "expanded" ? "full" : "compact"} />
          </Link>
        </motion.div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {session?.user.role === "admin" && <NavAdmin items={data.admin} />}
      </SidebarContent>
      <SidebarFooter className="pl-0">
        <motion.div
          variants={footerVariants}
          initial="hidden"
          animate="visible"
        >
          <NavSecondary items={data.navSecondary} className="mt-auto" />
          {/* <NavUser /> */}
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  );
}
