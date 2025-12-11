"use server";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { announcement, user } from "@/db/schema";

export async function createAnnouncement(data: {
  title: string;
  content: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser?.isAdmin) {
    throw new Error("Forbidden: Only admins can create announcements");
  }

  await db.insert(announcement).values({
    id: crypto.randomUUID(),
    title: data.title,
    content: data.content,
    authorId: session.user.id,
  });
}

export async function getAnnouncements() {
  // All users can read announcements
  return await db.query.announcement.findMany({
    where: eq(announcement.active, true),
    orderBy: [desc(announcement.createdAt)],
  });
}

export async function getAdminAnnouncements() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser?.isAdmin) {
    throw new Error("Forbidden");
  }

  return await db.query.announcement.findMany({
    orderBy: [desc(announcement.createdAt)],
    with: {
      author: true,
    },
  });
}

export async function deleteAnnouncement(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (dbUser?.role !== "admin") {
    throw new Error("Forbidden");
  }

  await db.delete(announcement).where(eq(announcement.id, id));
}

export async function updateAnnouncement(
  id: string,
  data: { title?: string; content?: string; active?: boolean },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser?.isAdmin) {
    throw new Error("Forbidden");
  }

  await db
    .update(announcement)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(announcement.id, id));
}
