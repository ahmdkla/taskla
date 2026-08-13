import Link from "next/link";
import { format, isSameMonth, isSameDay, isToday } from "date-fns";
import { getMonthGrid, WEEKDAY_LABELS } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function MiniCalendar({
  month = new Date(),
  markedDates = [],
}: {
  month?: Date;
  markedDates?: Date[];
}) {
  const days = getMonthGrid(month);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{format(month, "MMMM yyyy")}</p>
        <Link
          href="/schedule"
          className="text-xs text-brand hover:underline"
        >
          View schedule
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-muted-foreground">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const marked = markedDates.some((d) => isSameDay(d, day));
          const inMonth = isSameMonth(day, month);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  !inMonth && "text-muted-foreground/40",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <span
                className={cn(
                  "size-1 rounded-full",
                  marked ? "bg-brand" : "bg-transparent"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
