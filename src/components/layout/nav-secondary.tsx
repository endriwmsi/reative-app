"use client";

import type { Icon } from "@tabler/icons-react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <motion.div
                variants={hoverVariants}
                initial="initial"
                whileHover="hover"
              >
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-all",
                      pathname.startsWith(item.url)
                        ? "text-sidebar-foreground bg-sidebar-accent shadow-sm border border-sidebar-border"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent",
                    )}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </motion.div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
