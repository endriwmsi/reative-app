"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface AnnouncementsListProps {
  announcements: Announcement[];
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  if (announcements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-lg font-medium">
            Nenhum aviso no momento
          </p>
          <p className="text-sm text-muted-foreground">
            Fique atento para novidades!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-40 lg:h-[300px] pr-4">
        <div className="space-y-2">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              tabIndex={0}
              className={cn(
                "cursor-pointer transition-all hover:bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[295px]",
              )}
              onClick={() => setSelectedAnnouncement(announcement)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAnnouncement(announcement);
                }
              }}
            >
              <CardContent>
                <CardTitle>{announcement.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2">
                  {announcement.content}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog
        open={!!selectedAnnouncement}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2">
              <Calendar className="h-4 w-4" />
              {selectedAnnouncement?.createdAt &&
                new Date(selectedAnnouncement.createdAt).toLocaleString(
                  "pt-BR",
                )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {selectedAnnouncement?.content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
