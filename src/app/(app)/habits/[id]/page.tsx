import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  FlameIcon,
  SnowflakeIcon,
  TrophyIcon,
  CheckIcon,
  RotateCcwIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { HabitBadges } from "@/components/habit-badges";
import { HabitActions } from "./habit-actions";
import {
  computeProgress,
  toDayKey,
  dayKeyToDate,
  STAGES,
  GRACE_PER_STAGE,
} from "@/lib/habits";
import { todayKey } from "@/lib/day";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof FlameIcon;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className={cn("size-3.5", tone)} />
          {label}
        </div>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function HabitDetailPage({
  params,
}: PageProps<"/habits/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const today = todayKey();

  const [habit, categories] = await Promise.all([
    db.habit.findFirst({
      where: { id, userId: user.id },
      include: {
        entries: { select: { date: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    db.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!habit) notFound();

  const startKey = toDayKey(habit.startedOn);
  const entryKeys = habit.entries.map((e) => toDayKey(e.date));
  const progress = computeProgress(entryKeys, startKey, today);

  return (
    <>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/habits" />}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeftIcon />
          All habits
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: habit.color }}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              {habit.name}
            </h1>
          </div>
          {habit.why && (
            <p className="text-sm text-muted-foreground">{habit.why}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Started {format(dayKeyToDate(startKey), "MMM d, yyyy")}
            {habit.category ? ` · ${habit.category.name}` : ""}
            {habit.archivedAt ? " · Archived" : ""}
          </p>
        </div>
        <HabitActions
          habit={{
            id: habit.id,
            name: habit.name,
            why: habit.why,
            color: habit.color,
            categoryId: habit.categoryId,
          }}
          categories={categories}
          archived={habit.archivedAt !== null}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Current streak"
          value={`${progress.currentStreak}`}
          hint={progress.currentStreak === 1 ? "day" : "days"}
          icon={FlameIcon}
          tone={progress.currentStreak > 0 ? "text-warning" : undefined}
        />
        <Stat
          label="Best streak"
          value={`${progress.bestStreak}`}
          hint={progress.bestStreak === 1 ? "day" : "days"}
          icon={TrophyIcon}
        />
        <Stat
          label="Total done"
          value={`${progress.totalCompletions}`}
          hint={`${Math.round(progress.consistency * 100)}% of days`}
          icon={CheckIcon}
        />
        <Stat
          label="Freezes left"
          value={`${progress.freezesLeft}`}
          hint={`of ${GRACE_PER_STAGE} this stage`}
          icon={SnowflakeIcon}
          tone={progress.freezesLeft === 0 ? "text-destructive" : undefined}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Milestones</h2>
            <HabitBadges earnedStages={progress.earnedStages} size="lg" />
          </div>

          <ol className="space-y-3">
            {STAGES.map((stage) => {
              const earned = progress.earnedStages.includes(stage.stage);
              const isCurrent = progress.stage === stage.stage;
              const reached = Math.min(
                Math.max(progress.completions - stage.floor, 0),
                stage.target - stage.floor
              );
              const span = stage.target - stage.floor;
              return (
                <li key={stage.stage} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                      earned
                        ? "bg-success/15 text-success"
                        : isCurrent
                          ? "bg-brand/15 text-brand"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {earned ? <CheckIcon className="size-3.5" /> : stage.stage}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm font-medium">
                        {stage.title}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {stage.target} completions
                        </span>
                      </p>
                      {isCurrent && (
                        <span className="text-xs text-muted-foreground">
                          {reached}/{span} in this stage
                        </span>
                      )}
                      {earned && progress.earnedOn[stage.stage] && (
                        <span className="text-xs text-muted-foreground">
                          {format(
                            dayKeyToDate(progress.earnedOn[stage.stage]),
                            "MMM d, yyyy"
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stage.blurb}
                    </p>
                    {isCurrent && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((reached / span) * 100)}%`,
                            backgroundColor: habit.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {progress.restarts > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RotateCcwIcon className="size-3.5" />
              Stage restarted {progress.restarts}{" "}
              {progress.restarts === 1 ? "time" : "times"} after running out of
              freezes — badges you earned were kept.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 py-4">
          <h2 className="text-sm font-medium">History</h2>
          <HabitHeatmap
            entryKeys={entryKeys}
            todayKey={today}
            startKey={startKey}
            color={habit.color}
            weeks={34}
            showLegend
          />
        </CardContent>
      </Card>
    </>
  );
}
