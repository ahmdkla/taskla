"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function logFocusSession(
  taskId: string | null,
  durationMinutes: number
) {
  const session = await verifySession();
  if (durationMinutes < 1) return;

  if (taskId) {
    const task = await db.task.findFirst({
      where: { id: taskId, userId: session.userId },
    });
    if (!task) taskId = null;
  }

  const endedAt = new Date();
  const startedAt = new Date(endedAt.getTime() - durationMinutes * 60 * 1000);

  await db.focusSession.create({
    data: {
      userId: session.userId,
      taskId,
      startedAt,
      endedAt,
      durationMinutes: Math.round(durationMinutes),
    },
  });

  revalidatePath("/focus");
  revalidatePath("/overview");
  revalidatePath("/summary");
}
