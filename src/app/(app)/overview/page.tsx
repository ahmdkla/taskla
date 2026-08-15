import Link from "next/link";
import { startOfDay, addDays, startOfMonth, endOfMonth } from "date-fns";
import {
  FolderKanbanIcon,
  ListChecksIcon,
  EyeIcon,
  AlertTriangleIcon,
  ZapIcon,
  PlusIcon,
  TimerIcon,
  NotebookPenIcon,
  FlameIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Greeting } from "@/components/greeting";
import { MoodPicker } from "@/components/mood-picker";
import { MiniCalendar } from "@/components/mini-calendar";
import { TaskChecklistItem } from "@/components/task-checklist-item";
import { QuickTaskDialog } from "@/components/quick-task-dialog";
import {
  HabitTodayItem,
  type TodayHabit,
} from "@/components/habit-today-item";
import { computeProgress, toDayKey } from "@/lib/habits";
import { todayKey } from "@/lib/day";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await getCurrentUser();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Grouped into two waves (rather than one large Promise.all) to keep
  // concurrent connections low for local/small Postgres instances.
  const [activeProjects, statusCounts, overdueTasks] = await Promise.all([
    db.project.count({ where: { userId: user.id, status: "active" } }),
    db.task.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: { not: "done" },
        dueDate: { lt: today },
      },
    }),
  ]);

  const [todayTasks, overdueList, upcomingTasks, monthTasks, todayLog] =
    await Promise.all([
    db.task.findMany({
      where: {
        userId: user.id,
        status: { not: "done" },
        dueDate: { gte: today, lt: tomorrow },
      },
      orderBy: { priority: "desc" },
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
    db.task.findMany({
      where: {
        userId: user.id,
        status: { not: "done" },
        dueDate: { lt: today },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
    db.task.findMany({
      where: { userId: user.id, status: { not: "done" } },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
      take: 8,
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
    db.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      select: { dueDate: true },
    }),
    db.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    }),
  ]);

  const habitRecords = await db.habit.findMany({
    where: { userId: user.id, archivedAt: null },
    include: { entries: { select: { date: true } } },
    orderBy: { createdAt: "asc" },
  });

  const habitDayKey = todayKey();
  const habits: TodayHabit[] = habitRecords.map((habit) => {
    const progress = computeProgress(
      habit.entries.map((e) => toDayKey(e.date)),
      toDayKey(habit.startedOn),
      habitDayKey
    );
    return {
      id: habit.id,
      name: habit.name,
      color: habit.color,
      doneToday: progress.doneToday,
      currentStreak: progress.currentStreak,
    };
  });
  const habitsDone = habits.filter((h) => h.doneToday).length;

  const countFor = (status: string) =>
    statusCounts.find((s) => s.status === status)?._count._all ?? 0;
  const totalTasks = statusCounts.reduce((sum, s) => sum + s._count._all, 0);
  const doneTasks = countFor("done");
  const activeTasks = totalTasks - doneTasks;
  const inReviewTasks = countFor("in_review");
  const inProgressTasks = countFor("in_progress");

  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const markedDates = monthTasks
    .map((t) => t.dueDate)
    .filter((d): d is Date => d !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              <Greeting name={user.name} />
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what you need to focus on today.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Mood today:</span>
              <MoodPicker current={todayLog?.mood ?? null} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QuickTaskDialog />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/focus" />}
            >
              <TimerIcon />
              Start focus
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/notepad" />}
            >
              <NotebookPenIcon />
              Add note
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Active projects" value={activeProjects} icon={FolderKanbanIcon} />
          <StatCard label="Active tasks" value={activeTasks} icon={ListChecksIcon} />
          <StatCard label="In review" value={inReviewTasks} icon={EyeIcon} tone="warning" />
          <StatCard label="Overdue" value={overdueTasks} icon={AlertTriangleIcon} tone="destructive" />
          <StatCard label="In progress" value={inProgressTasks} icon={ZapIcon} tone="success" />
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-xs text-muted-foreground">
              {doneTasks}/{totalTasks} tasks done
            </span>
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-medium">{progress}%</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">Today&apos;s tasks</h2>
              <span className="text-xs text-muted-foreground">
                {todayTasks.length + overdueList.length}
              </span>
            </div>
            {todayTasks.length === 0 && overdueList.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due today.
              </p>
            ) : (
              <div className="space-y-3">
                {overdueList.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-destructive">
                      Overdue ({overdueList.length})
                    </p>
                    <div className="divide-y divide-border">
                      {overdueList.map((task) => (
                        <TaskChecklistItem key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                )}
                {todayTasks.length > 0 && (
                  <div>
                    {overdueList.length > 0 && (
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Due today ({todayTasks.length})
                      </p>
                    )}
                    <div className="divide-y divide-border">
                      {todayTasks.map((task) => (
                        <TaskChecklistItem key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">My to-do list</h2>
              <Link href="/tasks" className="text-xs text-brand hover:underline">
                View all
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                <PlusIcon className="size-5" />
                No tasks yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingTasks.map((task) => (
                  <TaskChecklistItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <MiniCalendar month={today} markedDates={markedDates} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-medium">
                <FlameIcon className="size-4 text-warning" />
                Today&apos;s habits
                {habits.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {habitsDone}/{habits.length}
                  </span>
                )}
              </h2>
              <Link
                href="/habits"
                className="text-xs text-brand hover:underline"
              >
                {habits.length > 0 ? "View all" : "Start one"}
              </Link>
            </div>
            {habits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No habits yet — pick one small thing to do daily.
              </p>
            ) : (
              <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                {habits.map((habit) => (
                  <HabitTodayItem key={habit.id} habit={habit} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
