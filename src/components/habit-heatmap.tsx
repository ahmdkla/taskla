"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { heatmapDays, dayKeyToDate } from "@/lib/habits";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function HabitHeatmap({
  entryKeys,
  todayKey,
  startKey,
  color,
  weeks = 18,
  minWeeks = 6,
  showLegend = false,
}: {
  entryKeys: string[];
  todayKey: string;
  startKey: string;
  color: string;
  /** Upper bound on history shown. */
  weeks?: number;
  minWeeks?: number;
  showLegend?: boolean;
}) {
  const done = useMemo(() => new Set(entryKeys), [entryKeys]);

  // Only show as far back as the habit actually goes (plus a little runway),
  // so a two-week-old habit isn't mostly empty cells.
  const visibleWeeks = useMemo(() => {
    const daysSinceStart = Math.max(
      0,
      Math.round(
        (dayKeyToDate(todayKey).getTime() - dayKeyToDate(startKey).getTime()) /
          86_400_000
      )
    );
    const needed = Math.ceil((daysSinceStart + 1) / 7) + 1;
    return Math.min(weeks, Math.max(minWeeks, needed));
  }, [todayKey, startKey, weeks, minWeeks]);

  const days = useMemo(
    () => heatmapDays(todayKey, visibleWeeks),
    [todayKey, visibleWeeks]
  );

  // Chunk into week columns (each column = Sun..Sat).
  const columns = useMemo(() => {
    const out: string[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex shrink-0 flex-col gap-0.75 pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <span
              key={i}
              className="h-3 text-[9px] leading-3 text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        {columns.map((week, wi) => (
          <div key={wi} className="flex shrink-0 flex-col gap-0.75">
            {week.map((key) => {
              const isFuture = key > todayKey;
              const beforeStart = key < startKey;
              const isDone = done.has(key);
              const isToday = key === todayKey;
              return (
                <span
                  key={key}
                  title={`${format(dayKeyToDate(key), "EEE, MMM d")}${
                    isDone ? " — done" : beforeStart || isFuture ? "" : " — missed"
                  }`}
                  className={cn(
                    "size-3 rounded-xs",
                    isFuture || beforeStart
                      ? "bg-muted/40"
                      : isDone
                        ? ""
                        : "bg-muted",
                    isToday && "ring-1 ring-foreground/40"
                  )}
                  style={isDone ? { backgroundColor: color } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      {showLegend && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-xs bg-muted" /> Missed
          </span>
          <span className="flex items-center gap-1">
            <span
              className="size-3 rounded-xs"
              style={{ backgroundColor: color }}
            />{" "}
            Done
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-xs bg-muted/40" /> Not tracked
          </span>
        </div>
      )}
    </div>
  );
}
