"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const MOODS = ["great", "good", "okay", "low", "rough"] as const;
export type Mood = (typeof MOODS)[number];

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function setTodayMood(mood: Mood) {
  const session = await verifySession();
  if (!MOODS.includes(mood)) return;

  const date = startOfToday();

  await db.dailyLog.upsert({
    where: { userId_date: { userId: session.userId, date } },
    create: { userId: session.userId, date, mood },
    update: { mood },
  });

  revalidatePath("/overview");
}
