import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import { auth } from "@/auth";
import { SubscriptionGuard } from "@/components/auth/subscription-guard";
import { ChangelogModal } from "@/components/changelog-modal";
import { DashboardSidebarWrapper } from "@/components/layout/dashboard-sidebar-wrapper";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";
import {
  SubscriptionProvider,
  type SubscriptionStatus,
} from "@/providers/subscription-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) redirect("/login");

  const [userSubscription] = await db
    .select({ status: subscription.status })
    .from(subscription)
    .where(eq(subscription.userId, session.user.id));

  const status = (userSubscription?.status || "none") as SubscriptionStatus;

  return (
    <SubscriptionProvider status={status}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SubscriptionGuard status={status} />
        <DashboardSidebarWrapper />
        <SidebarInset>
          <MainContentWrapper>{children}</MainContentWrapper>
          <ChangelogModal />
        </SidebarInset>
      </SidebarProvider>
    </SubscriptionProvider>
  );
}
