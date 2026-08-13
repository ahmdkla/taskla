import {
  startOfDay,
  subDays,
  eachDayOfInterval,
  format,
  startOfWeek,
} from "date-fns";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CompletionChart, type DayCount } from "./completion-chart";
import { CategoryChart, type CategoryCount } from "./category-chart";
import { StatusBreakdown } from "./status-breakdown";

export const dynamic = "force-dynamic";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
const OTHER_COLOR = "var(--muted-foreground)";

export default async function SummaryPage() {
  const user = await getCurrentUser();
  const today = startOfDay(new Date());
  const fourteenDaysAgo = subDays(today, 13);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const [
    totalCompleted,
    completedThisWeek,
    focusThisWeek,
    recentCompletions,
    categoriesWithCounts,
    uncategorizedCount,
    statusCounts,
  ] = await Promise.all([
    db.task.count({ where: { userId: user.id, status: "done" } }),
    db.task.count({
      where: { userId: user.id, status: "done", completedAt: { gte: weekStart } },
    }),
    db.focusSession.findMany({
      where: { userId: user.id, startedAt: { gte: weekStart } },
      select: { durationMinutes: true },
    }),
    db.task.findMany({
      where: {
        userId: user.id,
        status: "done",
        completedAt: { gte: fourteenDaysAgo },
      },
      select: { completedAt: true },
    }),
    db.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { tasks: true } },
      },
    }),
    db.task.count({ where: { userId: user.id, categoryId: null } }),
    db.task.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
  ]);

  const focusMinutesThisWeek = focusThisWeek.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0
  );

  const dayCounts: DayCount[] = eachDayOfInterval({
    start: fourteenDaysAgo,
    end: today,
  }).map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const count = recentCompletions.filter(
      (t) => t.completedAt && format(t.completedAt, "yyyy-MM-dd") === key
    ).length;
    return { date: key, label: format(day, "MMM d"), count };
  });

  const sortedCategories = [...categoriesWithCounts]
    .filter((c) => c._count.tasks > 0)
    .sort((a, b) => b._count.tasks - a._count.tasks);
  const topCategories = sortedCategories.slice(0, 5);
  const otherCount =
    sortedCategories.slice(5).reduce((sum, c) => sum + c._count.tasks, 0) +
    uncategorizedCount;

  const categoryData: CategoryCount[] = topCategories.map((c, i) => ({
    name: c.name,
    count: c._count.tasks,
    color: CHART_COLORS[i],
  }));
  if (otherCount > 0) {
    categoryData.push({ name: "Other", count: otherCount, color: OTHER_COLOR });
  }

  const statusCountMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all])
  );

  return (
    <>
      <PageHeader
        title="Summary"
        description="Completion trends, category breakdown, and focus time."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Tasks completed</p>
            <p className="text-2xl font-semibold">{totalCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Completed this week</p>
            <p className="text-2xl font-semibold">{completedThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Focus time this week</p>
            <p className="text-2xl font-semibold">
              {Math.floor(focusMinutesThisWeek / 60)}h {focusMinutesThisWeek % 60}m
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-medium">
              Tasks completed, last 14 days
            </h2>
            <CompletionChart data={dayCounts} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <h2 className="mb-2 text-sm font-medium">Tasks by category</h2>
            {categoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks yet.
              </p>
            ) : (
              <CategoryChart data={categoryData} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="py-4">
            <h2 className="mb-3 text-sm font-medium">Tasks by status</h2>
            <StatusBreakdown counts={statusCountMap} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
