"use client";

import type { Icon } from "@tabler/icons-react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
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

interface NavAdminProps {
  items: {
    name: string;
    url: string;
    icon: Icon;
  }[];
}

const NavAdmin = ({ items }: NavAdminProps) => {
  // const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <SidebarGroupLabel>Admin</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item, index) => (
            <motion.div key={item.name} variants={itemVariants} custom={index}>
              <SidebarMenuItem>
                <motion.div
                  variants={hoverVariants}
                  initial="initial"
                  whileHover="hover"
                >
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </motion.div>
              </SidebarMenuItem>
            </motion.div>
          ))}
        </SidebarMenu>
      </motion.div>
    </SidebarGroup>
  );
};

export default NavAdmin;
