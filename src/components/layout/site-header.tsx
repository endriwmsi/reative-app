"use client";
import { IconLogout } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Bell, Settings, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import { ModeToggle } from "./mode-toggle";

const mockNotifications = [
  { id: 1, title: "Bem vindo a plataforma", time: "1 min ago", unread: true },
];

export function SiteHeader() {
  const { data: session, isPending } = authClient.useSession();
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        {/* <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        /> */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="text-muted-foreground p-4 text-center">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <div className="flex w-full items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${notification.unread ? "bg-blue-500" : "bg-transparent"}`}
                      />
                      <span className="text-sm font-medium">
                        {notification.title}
                      </span>
                    </div>
                    <span className="text-muted-foreground ml-4 text-xs">
                      {notification.time}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/*  Added user info dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  {session?.user.image && (
                    <AvatarImage
                      src={session?.user.image || "/assets/placeholder.svg"}
                      alt={session?.user.name || "User"}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {session?.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden max-w-40 flex-col items-start md:flex">
                  {isPending ? (
                    <>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </>
                  ) : (
                    <>
                      <span className="truncate font-medium">
                        {session?.user.name || "SN"}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {session?.user.email}
                      </span>
                    </>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/configuracoes/perfil"
                  className="flex w-full cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Pefil
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Messages
              </DropdownMenuItem> */}
              <DropdownMenuItem asChild>
                <Link
                  href="/configuracoes"
                  className="flex w-full cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        redirect("/login");
                      },
                    },
                  });
                }}
                className="cursor-pointer"
              >
                <IconLogout />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
