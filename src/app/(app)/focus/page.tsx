import { startOfDay } from "date-fns";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { FocusTimer } from "./focus-timer";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const user = await getCurrentUser();
  const today = startOfDay(new Date());

  const [tasks, todaySessions, recentSessions] = await Promise.all([
    db.task.findMany({
      where: { userId: user.id, status: { not: "done" } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    db.focusSession.findMany({
      where: { userId: user.id, startedAt: { gte: today } },
      select: { durationMinutes: true },
    }),
    db.focusSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 6,
      include: { task: { select: { title: true } } },
    }),
  ]);

  const todayMinutes = todaySessions.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0
  );

  return (
    <>
      <PageHeader
        title="Focus"
        description="Run a focus timer session, optionally tied to a task."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            <FocusTimer tasks={tasks} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-2xl font-semibold">
                {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
              </p>
              <p className="text-xs text-muted-foreground">
                {todaySessions.length} session
                {todaySessions.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <p className="mb-2 text-sm font-medium">Recent sessions</p>
              {recentSessions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No sessions yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentSessions.map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-muted-foreground">
                        {session.task?.title ?? "No task"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {session.durationMinutes}m ·{" "}
                        {format(session.startedAt, "MMM d")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
