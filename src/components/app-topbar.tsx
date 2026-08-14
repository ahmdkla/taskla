import { startOfDay, addDays } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickTaskDialog } from "@/components/quick-task-dialog";
import { HelpButton } from "@/components/help-button";
import { SearchCommand } from "@/components/search-command";
import { NotificationBell } from "@/components/notification-bell";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";

export async function AppTopbar() {
  const session = await verifySession();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [overdue, dueToday] = await Promise.all([
    db.task.findMany({
      where: {
        userId: session.userId,
        status: { not: "done" },
        dueDate: { lt: today },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    db.task.findMany({
      where: {
        userId: session.userId,
        status: { not: "done" },
        dueDate: { gte: today, lt: tomorrow },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { priority: "desc" },
      take: 10,
    }),
  ]);

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex flex-1 justify-center px-2">
        <SearchCommand />
      </div>
      <NotificationBell overdue={overdue} dueToday={dueToday} />
      <HelpButton />
      <QuickTaskDialog />
      <ThemeToggle />
    </header>
  );
}
