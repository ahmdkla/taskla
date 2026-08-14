"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { BellIcon, BellRingIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ReminderItem = {
  id: string;
  title: string;
  dueDate: Date | null;
};

export function NotificationBell({
  overdue,
  dueToday,
}: {
  overdue: ReminderItem[];
  dueToday: ReminderItem[];
}) {
  const [open, setOpen] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  const total = overdue.length + dueToday.length;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotifSupported(true);
    setNotifPermission(Notification.permission);

    // One system notification per browser session, only if the user already
    // granted permission (never prompt unasked).
    if (
      Notification.permission === "granted" &&
      overdue.length > 0 &&
      !sessionStorage.getItem("taskla_notified")
    ) {
      sessionStorage.setItem("taskla_notified", "1");
      new Notification("Taskla", {
        body: `You have ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}.`,
      });
    }
  }, [overdue.length]);

  function requestPermission() {
    Notification.requestPermission().then(setNotifPermission);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              total > 0
                ? `Notifications: ${overdue.length} overdue, ${dueToday.length} due today`
                : "Notifications"
            }
            className="relative"
          />
        }
      >
        {overdue.length > 0 ? <BellRingIcon /> : <BellIcon />}
        {total > 0 && (
          <span
            className={
              "absolute top-1 right-1 size-2 rounded-full " +
              (overdue.length > 0 ? "bg-destructive" : "bg-brand")
            }
            aria-hidden="true"
          />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-sm font-medium">Reminders</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing due — you&apos;re all caught up.
            </p>
          ) : (
            <>
              {overdue.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-destructive">
                    Overdue ({overdue.length})
                  </p>
                  {overdue.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks?edit=${task.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="flex-1 truncate">{task.title}</span>
                      {task.dueDate && (
                        <span className="shrink-0 text-xs text-destructive">
                          {format(task.dueDate, "MMM d")}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              {dueToday.length > 0 && (
                <div>
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Due today ({dueToday.length})
                  </p>
                  {dueToday.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks?edit=${task.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="flex-1 truncate">{task.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {notifSupported && notifPermission === "default" && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={requestPermission}
            >
              Enable browser alerts
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
