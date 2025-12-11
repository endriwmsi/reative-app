import { getAdminAnnouncements } from "@/actions/announcement/announcement.action";
import { AnnouncementsTable } from "./_components/announcements-table";
import { CreateAnnouncementButton } from "./_components/create-announcement-button";

const AnnouncementsPage = async () => {
  const announcements = await getAdminAnnouncements();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avisos</h1>
          <p className="text-muted-foreground">
            Gerencie os avisos exibidos na plataforma.
          </p>
        </div>
        <CreateAnnouncementButton />
      </div>
      <AnnouncementsTable announcements={announcements} />
    </div>
  );
};

export default AnnouncementsPage;
