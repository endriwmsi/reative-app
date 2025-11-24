import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import { auth } from "@/auth";
import { DashboardSidebarWrapper } from "@/components/layout/dashboard-sidebar-wrapper";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <DashboardSidebarWrapper />
      <SidebarInset>
        <MainContentWrapper>{children}</MainContentWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
