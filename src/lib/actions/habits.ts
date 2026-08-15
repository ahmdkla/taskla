"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { computeProgress, toDayKey, dayKeyToDate } from "@/lib/habits";
import { todayKey } from "@/lib/day";

const HabitSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(80),
  why: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined)),
  color: z.enum(CATEGORY_COLORS, { error: "Pick a color." }),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : undefined)),
});

export type HabitFormState =
  | {
      errors?: { name?: string[]; why?: string[]; color?: string[] };
      message?: string;
    }
  | undefined;

function parseHabitForm(formData: FormData) {
  return HabitSchema.safeParse({
    name: formData.get("name"),
    why: formData.get("why") || undefined,
    color: formData.get("color"),
    categoryId: formData.get("categoryId") || undefined,
  });
}

function revalidateHabits() {
  revalidatePath("/habits");
  revalidatePath("/overview");
}

export async function createHabit(
  _state: HabitFormState,
  formData: FormData
): Promise<HabitFormState> {
  const session = await verifySession();
  const validated = parseHabitForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, why, color, categoryId } = validated.data;

  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: session.userId },
    });
    if (!category) return { message: "Category not found." };
  }

  await db.habit.create({
    data: {
      userId: session.userId,
      name,
      why,
      color,
      categoryId,
      // Day 1 is the day it's created.
      startedOn: dayKeyToDate(todayKey()),
    },
  });

  revalidateHabits();
}

export async function updateHabit(
  habitId: string,
  _state: HabitFormState,
  formData: FormData
): Promise<HabitFormState> {
  const session = await verifySession();
  const validated = parseHabitForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const habit = await db.habit.findFirst({
    where: { id: habitId, userId: session.userId },
  });
  if (!habit) return { message: "Habit not found." };

  const { name, why, color, categoryId } = validated.data;

  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: session.userId },
    });
    if (!category) return { message: "Category not found." };
  }

  await db.habit.update({
    where: { id: habitId },
    data: { name, why: why ?? null, color, categoryId: categoryId ?? null },
  });

  revalidateHabits();
  revalidatePath(`/habits/${habitId}`);
}

export async function deleteHabit(habitId: string) {
  const session = await verifySession();
  await db.habit.deleteMany({ where: { id: habitId, userId: session.userId } });
  revalidateHabits();
}

export async function setHabitArchived(habitId: string, archived: boolean) {
  const session = await verifySession();
  await db.habit.updateMany({
    where: { id: habitId, userId: session.userId },
    data: { archivedAt: archived ? new Date() : null },
  });
  revalidateHabits();
  revalidatePath(`/habits/${habitId}`);
}

export type ToggleHabitResult =
  | {
      completed: boolean;
      /** Stage whose badge was just earned by this completion, if any. */
      earnedStage?: 1 | 2 | 3;
      completions: number;
      currentStreak: number;
    }
  | undefined;

/**
 * Marks (or unmarks) a day for a habit. Only today and yesterday are
 * writable — enough to forgive forgetting before bed without letting the
 * record be rewritten wholesale.
 */
export async function toggleHabitDay(
  habitId: string,
  dayKey?: string
): Promise<ToggleHabitResult> {
  const session = await verifySession();

  const habit = await db.habit.findFirst({
    where: { id: habitId, userId: session.userId },
    include: { entries: { select: { date: true } } },
  });
  if (!habit) return undefined;

  const today = todayKey();
  const target = dayKey ?? today;

  const yesterday = toDayKey(
    new Date(dayKeyToDate(today).getTime() - 86_400_000)
  );
  if (target !== today && target !== yesterday) return undefined;

  const before = habit.entries.map((e) => toDayKey(e.date));
  const startKey = toDayKey(habit.startedOn);
  const wasDone = before.includes(target);

  if (wasDone) {
    await db.habitEntry.deleteMany({
      where: { habitId, date: dayKeyToDate(target) },
    });
  } else {
    await db.habitEntry.create({
      data: { habitId, date: dayKeyToDate(target) },
    });
  }

  const after = wasDone
    ? before.filter((k) => k !== target)
    : [...before, target];

  const prevProgress = computeProgress(before, startKey, today);
  const nextProgress = computeProgress(after, startKey, today);

  // A badge counts as "just earned" only if this action is what produced it.
  const earnedStage = nextProgress.earnedStages.find(
    (s) => !prevProgress.earnedStages.includes(s)
  ) as 1 | 2 | 3 | undefined;

  revalidateHabits();
  revalidatePath(`/habits/${habitId}`);

  return {
    completed: !wasDone,
    earnedStage,
    completions: nextProgress.completions,
    currentStreak: nextProgress.currentStreak,
  };
}
