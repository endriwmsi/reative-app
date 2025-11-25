"use client";

import { type Icon, IconChevronRight } from "@tabler/icons-react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {/* <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 bg-transparent group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem> */}
        </SidebarMenu>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SidebarMenu>
            {items.map((item, index) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                custom={index}
              >
                <SidebarMenuItem>
                  {item.items ? (
                    <Collapsible
                      open={openItems.includes(item.title)}
                      onOpenChange={() => toggleItem(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <motion.div
                          variants={hoverVariants}
                          initial="initial"
                          whileHover="hover"
                        >
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive(item.url)}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <IconChevronRight
                              className={`ml-auto transition-transform ${openItems.includes(item.title) ? "rotate-90" : ""}`}
                            />
                          </SidebarMenuButton>
                        </motion.div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem, subIndex) => (
                            <motion.div
                              key={subItem.title}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: subIndex * 0.1,
                                ease: "easeOut",
                              }}
                            >
                              <SidebarMenuSubItem>
                                <motion.div
                                  variants={hoverVariants}
                                  initial="initial"
                                  whileHover="hover"
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(subItem.url)}
                                  >
                                    <Link
                                      href={subItem.url}
                                      className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-all",
                                        pathname === item.url
                                          ? "text-sidebar-foreground bg-sidebar-accent shadow-sm border border-sidebar-border"
                                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent",
                                      )}
                                    >
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </motion.div>
                              </SidebarMenuSubItem>
                            </motion.div>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <motion.div
                      variants={hoverVariants}
                      initial="initial"
                      whileHover="hover"
                    >
                      <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        isActive={isActive(item.url)}
                      >
                        <Link
                          href={item.url}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-all",
                            pathname === item.url
                              ? "text-sidebar-foreground bg-sidebar-accent shadow-sm border border-sidebar-border"
                              : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent",
                          )}
                        >
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  )}
                </SidebarMenuItem>
              </motion.div>
            ))}
          </SidebarMenu>
        </motion.div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
