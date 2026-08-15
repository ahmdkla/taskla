"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, FlameIcon, SnowflakeIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { HabitBadges } from "@/components/habit-badges";
import { HabitCelebration } from "@/components/habit-celebration";
import { toggleHabitDay } from "@/lib/actions/habits";
import { computeProgress } from "@/lib/habits";
import { cn } from "@/lib/utils";

export type HabitCardData = {
  id: string;
  name: string;
  why: string | null;
  color: string;
  startKey: string;
  entryKeys: string[];
  category: { name: string; color: string } | null;
};

export function HabitCard({
  habit,
  todayKey,
}: {
  habit: HabitCardData;
  todayKey: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [celebrating, setCelebrating] = useState<1 | 2 | 3 | null>(null);
  // Optimistic so the tick feels instant on mobile.
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);

  const progress = computeProgress(habit.entryKeys, habit.startKey, todayKey);
  const done = optimisticDone ?? progress.doneToday;

  function handleToggle() {
    setOptimisticDone(!done);
    startTransition(async () => {
      const result = await toggleHabitDay(habit.id);
      setOptimisticDone(null);
      router.refresh();
      if (result?.earnedStage) setCelebrating(result.earnedStage);
    });
  }

  const target = progress.stageDef?.target ?? progress.completions;

  return (
    <>
      <Card className={cn("transition-opacity", isPending && "opacity-70")}>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleToggle}
              aria-label={
                done
                  ? `Mark ${habit.name} as not done today`
                  : `Mark ${habit.name} as done today`
              }
              aria-pressed={done}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-95",
                done
                  ? "border-transparent text-white"
                  : "border-dashed border-border text-transparent hover:border-solid"
              )}
              style={done ? { backgroundColor: habit.color } : undefined}
            >
              <CheckIcon className="size-5" strokeWidth={3} />
            </button>

            <div className="min-w-0 flex-1">
              <Link
                href={`/habits/${habit.id}`}
                className="font-medium hover:underline"
              >
                {habit.name}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FlameIcon
                    className={cn(
                      "size-3.5",
                      progress.currentStreak > 0 && "text-warning"
                    )}
                  />
                  {progress.currentStreak} day
                  {progress.currentStreak === 1 ? "" : "s"}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    progress.freezesLeft === 0 && "text-destructive"
                  )}
                  title="Missed days you can still afford in this stage"
                >
                  <SnowflakeIcon className="size-3.5" />
                  {progress.freezesLeft} left
                </span>
                {habit.category && (
                  <span className="flex items-center gap-1">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: habit.category.color }}
                    />
                    {habit.category.name}
                  </span>
                )}
              </div>
            </div>

            <HabitBadges earnedStages={progress.earnedStages} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {progress.isComplete
                  ? "Habit formed 🎉"
                  : `${progress.stageDef?.title} · ${progress.completions}/${target}`}
              </span>
              <span className="text-muted-foreground">
                {progress.isComplete
                  ? `${progress.totalCompletions} total`
                  : `${target - progress.completions} to go`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(progress.stageProgress * 100)}%`,
                  backgroundColor: habit.color,
                }}
              />
            </div>
          </div>

          <HabitHeatmap
            entryKeys={habit.entryKeys}
            todayKey={todayKey}
            startKey={habit.startKey}
            color={habit.color}
            weeks={14}
          />
        </CardContent>
      </Card>

      <HabitCelebration
        stage={celebrating}
        habitName={habit.name}
        onClose={() => setCelebrating(null)}
      />
    </>
  );
}
