import Link from "next/link";
import {
  format,
  parse,
  startOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { getMonthGrid } from "@/lib/calendar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "../tasks/task-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SchedulePage({
  searchParams,
}: PageProps<"/schedule">) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const currentMonth =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? parse(monthParam, "yyyy-MM", new Date())
      : new Date();

  const days = getMonthGrid(currentMonth);
  const gridStart = days[0];
  const gridEnd = days[days.length - 1];

  const [tasks, categories, projects] = await Promise.all([
    db.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: gridStart, lte: gridEnd },
      },
      orderBy: { priority: "desc" },
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
    db.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    db.project.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const tasksByDay = new Map<string, typeof tasks>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = format(task.dueDate, "yyyy-MM-dd");
    const existing = tasksByDay.get(key);
    if (existing) {
      existing.push(task);
    } else {
      tasksByDay.set(key, [task]);
    }
  }

  const prevMonth = format(subMonths(startOfMonth(currentMonth), 1), "yyyy-MM");
  const nextMonth = format(addMonths(startOfMonth(currentMonth), 1), "yyyy-MM");

  return (
    <>
      <PageHeader
        title="Schedule"
        description="A full calendar view of your tasks and due dates."
        actions={
          <TaskDialog
            categories={categories}
            projects={projects}
            trigger={
              <Button>
                <PlusIcon />
                New task
              </Button>
            }
          />
        }
      />
      <Card>
        <CardContent className="py-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="icon-sm"
              nativeButton={false}
              aria-label="Previous month"
              render={<Link href={`/schedule?month=${prevMonth}`} />}
            >
              <ChevronLeftIcon />
            </Button>
            <h2 className="text-base font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon-sm"
              nativeButton={false}
              aria-label="Next month"
              render={<Link href={`/schedule?month=${nextMonth}`} />}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-26 bg-background p-1.5",
                    !inMonth && "bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs",
                      !inMonth && "text-muted-foreground/50",
                      isToday(day) && "bg-primary font-medium text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                          task.status === "done"
                            ? "bg-muted text-muted-foreground line-through"
                            : "bg-brand/10 text-brand"
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
