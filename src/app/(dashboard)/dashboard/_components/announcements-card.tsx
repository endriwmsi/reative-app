import { IconBell } from "@tabler/icons-react";
import { getAnnouncements } from "@/actions/announcement/announcement.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementsList } from "./announcements-list";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface AnnouncementsCardProps {
  announcements?: Announcement[];
}

const AnnouncementsCard = async ({
  announcements: providedAnnouncements,
}: AnnouncementsCardProps = {}) => {
  const announcements = providedAnnouncements ?? (await getAnnouncements());

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBell className="size-5 text-blue-500" />
          Avisos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <AnnouncementsList announcements={announcements} />
      </CardContent>
    </Card>
  );
};

export default AnnouncementsCard;
