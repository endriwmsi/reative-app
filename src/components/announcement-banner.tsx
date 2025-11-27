"use client";

import { AlertTriangle, Info } from "lucide-react";

interface AnnouncementBannerProps {
  type: "warning" | "info";
  message: string;
}

export function AnnouncementBanner({ type, message }: AnnouncementBannerProps) {
  if (type === "warning") {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Info className="h-4 w-4" />
        {message}
      </div>
    </div>
  );
}
