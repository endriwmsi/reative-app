"use client";

import {
  IconDashboard,
  IconPackage,
  IconSend,
  IconSettings,
  IconTicket,
} from "@tabler/icons-react";
import Image from "next/image";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

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
  // documents: [
  //   {
  //     name: "Data Library",
  //     url: "#",
  //     icon: IconDatabase,
  //   },
  //   {
  //     name: "Reports",
  //     url: "#",
  //     icon: IconReport,
  //   },
  //   {
  //     name: "Word Assistant",
  //     url: "#",
  //     icon: IconFileWord,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                {state === "expanded" ? (
                  <Image
                    src="/assets/images/logo.svg"
                    alt="Logo"
                    width={150}
                    height={40}
                    className="h-8 w-auto"
                  />
                ) : (
                  <Image
                    src="/assets/images/logo-mobile.svg"
                    alt="Logo"
                    width={150}
                    height={40}
                    className="h-8 w-auto"
                  />
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser />
      </SidebarFooter> */}
    </Sidebar>
  );
}
