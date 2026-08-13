"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function dismissTutorial() {
  const session = await verifySession();

  await db.user.update({
    where: { id: session.userId },
    data: { tutorialSeen: true },
  });
}
