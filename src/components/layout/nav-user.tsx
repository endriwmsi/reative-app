"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { getUserInitials } from "@/lib/utils";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session, isPending } = authClient.useSession();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {session?.user.image && (
                  <AvatarImage
                    src={session?.user.image}
                    alt={session?.user.name}
                  />
                )}
                <AvatarFallback className="rounded-lg">
                  {session?.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
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
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {session?.user.image && (
                    <AvatarImage
                      src={session?.user.image}
                      alt={session?.user.name}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {getUserInitials(session?.user.name || "SN")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
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
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
