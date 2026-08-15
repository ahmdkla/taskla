"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, FlameIcon } from "lucide-react";
import { HabitCelebration } from "@/components/habit-celebration";
import { toggleHabitDay } from "@/lib/actions/habits";
import { cn } from "@/lib/utils";

export type TodayHabit = {
  id: string;
  name: string;
  color: string;
  doneToday: boolean;
  currentStreak: number;
};

export function HabitTodayItem({ habit }: { habit: TodayHabit }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [celebrating, setCelebrating] = useState<1 | 2 | 3 | null>(null);
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);

  const done = optimisticDone ?? habit.doneToday;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2.5 py-1.5",
          isPending && "opacity-60"
        )}
      >
        <button
          type="button"
          aria-label={
            done
              ? `Mark ${habit.name} as not done today`
              : `Mark ${habit.name} as done today`
          }
          aria-pressed={done}
          onClick={() => {
            setOptimisticDone(!done);
            startTransition(async () => {
              const result = await toggleHabitDay(habit.id);
              setOptimisticDone(null);
              router.refresh();
              if (result?.earnedStage) setCelebrating(result.earnedStage);
            });
          }}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-95",
            done
              ? "border-transparent text-white"
              : "border-dashed border-border text-transparent hover:border-solid"
          )}
          style={done ? { backgroundColor: habit.color } : undefined}
        >
          <CheckIcon className="size-3.5" strokeWidth={3} />
        </button>
        <span
          className={cn(
            "flex-1 truncate text-sm",
            done && "text-muted-foreground line-through"
          )}
        >
          {habit.name}
        </span>
        {habit.currentStreak > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <FlameIcon className="size-3 text-warning" />
            {habit.currentStreak}
          </span>
        )}
      </div>
      <HabitCelebration
        stage={celebrating}
        habitName={habit.name}
        onClose={() => setCelebrating(null)}
      />
    </>
  );
}
