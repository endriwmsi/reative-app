import type { Metadata } from "next";
import { getDashboardMetrics } from "@/actions/dashboard/dashboard-metrics.action";
import FutureFeaturesCard from "./_components/future-features-card";
import SectionCards from "./_components/section-cards";
import TopPartnersPodium from "./_components/top-partners-podium";
import UpcomingFeatures from "./_components/upcoming-features";
import WelcomeMessage from "./_components/welcome-message";

export const metadata: Metadata = {
  title: "Hub LN - Dashboard",
  description: "Dashboard principal do Hub LN.",
};

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="@container/main flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      <WelcomeMessage />

      <UpcomingFeatures />

      <SectionCards metrics={metrics} />

      <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 lg:grid-cols-3">
        <div className="col-span-2 h-full">
          <FutureFeaturesCard />
        </div>
        <div className="col-span-1 h-full">
          <TopPartnersPodium />
        </div>
      </div>

      {/* <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 lg:grid-cols-2">
          <PartnersList />
          <TopInvoicingList />
        </div>

        <div className="px-4 lg:px-6">
          <NewPartnersList />
        </div> */}
    </div>
  );
}
