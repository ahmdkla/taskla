import "server-only";
import { addDays, addWeeks, addMonths, endOfDay } from "date-fns";
import { db } from "@/lib/db";
import type { RecurrenceRule } from "@/generated/prisma/enums";

function addInterval(date: Date, rule: RecurrenceRule): Date {
  switch (rule) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      // date-fns clamps month-end (Jan 31 + 1mo = Feb 28/29).
      return addMonths(date, 1);
  }
}

export function computeNextDueDate(
  rule: RecurrenceRule,
  baseDate: Date,
  now: Date = new Date()
): Date {
  // Advance from the base date, then catch up past today so completing a
  // daily task five days late doesn't spawn an instantly-overdue occurrence.
  // Stepping by interval (not jumping to today) preserves weekday /
  // day-of-month alignment.
  let next = addInterval(baseDate, rule);
  const todayEnd = endOfDay(now);
  while (next <= todayEnd) {
    next = addInterval(next, rule);
  }
  return next;
}

type SpawnableTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  projectId: string | null;
  categoryId: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  recurrence: RecurrenceRule | null;
  dueDate: Date | null;
};

/**
 * Called after a recurring task transitions to done. Creates the next
 * occurrence (carrying the recurrence forward) and clears recurrence on the
 * completed row, so re-toggling the old task can never double-spawn.
 * Returns the spawned task's id and due date, or null if not recurring.
 */
export async function spawnNextOccurrence(
  task: SpawnableTask
): Promise<{ id: string; dueDate: Date } | null> {
  if (!task.recurrence) return null;

  const nextDueDate = computeNextDueDate(
    task.recurrence,
    task.dueDate ?? new Date()
  );

  const subtasks = await db.subtask.findMany({
    where: { taskId: task.id },
    orderBy: { order: "asc" },
    select: { title: true, order: true },
  });

  const [spawned] = await db.$transaction([
    db.task.create({
      data: {
        userId: task.userId,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        categoryId: task.categoryId,
        status: "todo",
        priority: task.priority,
        recurrence: task.recurrence,
        dueDate: nextDueDate,
        subtasks: {
          create: subtasks.map((s) => ({ title: s.title, order: s.order })),
        },
      },
      select: { id: true },
    }),
    db.task.update({
      where: { id: task.id },
      data: { recurrence: null },
    }),
  ]);

  return { id: spawned.id, dueDate: nextDueDate };
}
