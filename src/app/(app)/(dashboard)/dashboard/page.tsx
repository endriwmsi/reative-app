import type { Metadata } from "next";
import { getAnnouncements } from "@/actions/announcement/announcement.action";
import { getDashboardMetrics } from "@/actions/dashboard/dashboard-metrics.action";
import { ActiveActionsList } from "./_components/active-actions-list";
import AnnouncementsCard from "./_components/announcements-card";
// import FutureFeaturesCard from "./_components/future-features-card";
import SectionCards from "./_components/section-cards";
import TopPartnersPodium from "./_components/top-partners-podium";
import UpcomingFeatures from "./_components/upcoming-features";

export const metadata: Metadata = {
  title: "Hub LN - Dashboard",
  description: "Dashboard principal do Hub LN.",
};

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const announcements = await getAnnouncements();

  return (
    <div className="@container/main flex flex-col lg:flex-row">
      <div className="w-full lg:w-3/4 flex flex-col gap-6 py-4 md:gap-8 md:py-6">
        {/* Mobile only: Announcements at the top */}
        <div className="block lg:hidden px-4">
          <AnnouncementsCard announcements={announcements} />
        </div>

        <SectionCards metrics={metrics} />

        <div className="w-full px-4 lg:px-6">
          <ActiveActionsList />
        </div>

        <UpcomingFeatures />
      </div>

      <div className="w-full lg:w-1/4 flex flex-col gap-6 py-4 md:gap-8 md:py-6 px-4 lg:pr-6 lg:pl-0">
        <div className="flex flex-col gap-6">
          {/* Desktop only: Announcements in the sidebar */}
          <div className="hidden lg:block">
            <AnnouncementsCard announcements={announcements} />
          </div>
          <TopPartnersPodium />
        </div>
      </div>
    </div>
  );
}
