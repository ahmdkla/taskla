"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTaskDone } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-brand",
  high: "bg-warning",
  urgent: "bg-destructive",
};

export type ChecklistTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
};

export function TaskChecklistItem({ task }: { task: ChecklistTask }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";

  return (
    <div className={cn("flex items-center gap-2.5 py-1.5", isPending && "opacity-60")}>
      <Checkbox
        checked={done}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        onCheckedChange={() => {
          startTransition(async () => {
            await toggleTaskDone(task.id);
            router.refresh();
          });
        }}
      />
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          PRIORITY_COLOR[task.priority]
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "flex-1 truncate text-sm",
          done && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </span>
      {task.dueDate && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {format(task.dueDate, "MMM d")}
        </span>
      )}
    </div>
  );
}
