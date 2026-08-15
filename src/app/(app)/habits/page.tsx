import { PlusIcon, FlameIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HabitDialog } from "./habit-dialog";
import { HabitCard, type HabitCardData } from "./habit-card";
import { toDayKey, computeProgress, STAGES } from "@/lib/habits";
import { todayKey } from "@/lib/day";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const user = await getCurrentUser();
  const today = todayKey();

  const [habits, categories] = await Promise.all([
    db.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      include: {
        entries: { select: { date: true } },
        category: { select: { name: true, color: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const cards: HabitCardData[] = habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    why: habit.why,
    color: habit.color,
    startKey: toDayKey(habit.startedOn),
    entryKeys: habit.entries.map((e) => toDayKey(e.date)),
    category: habit.category,
  }));

  const doneToday = cards.filter(
    (c) => computeProgress(c.entryKeys, c.startKey, today).doneToday
  ).length;

  return (
    <>
      <PageHeader
        title="Habits"
        description={
          cards.length > 0
            ? `${doneToday} of ${cards.length} done today.`
            : "Build something one day at a time."
        }
        actions={
          <HabitDialog
            categories={categories}
            trigger={
              <Button>
                <PlusIcon />
                New habit
              </Button>
            }
          />
        }
      />

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <FlameIcon
              className="size-8 text-muted-foreground"
              strokeWidth={1.5}
            />
            <div className="space-y-1">
              <p className="font-medium">No habits yet</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Pick one small thing you&apos;ll do every day. Tick it off{" "}
                {STAGES[0].target} times for your first checkpoint,{" "}
                {STAGES[1].target} for the second, and{" "}
                {STAGES[2].target} to make it stick.
              </p>
            </div>
            <HabitDialog
              categories={categories}
              trigger={
                <Button>
                  <PlusIcon />
                  Start your first habit
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((habit) => (
            <HabitCard key={habit.id} habit={habit} todayKey={today} />
          ))}
        </div>
      )}
    </>
  );
}
