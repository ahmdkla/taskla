"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { PencilIcon, TrashIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PriorityBadge, CategoryBadge } from "@/components/badges";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { TaskDialog } from "./task-dialog";
import { deleteTask, toggleTaskDone } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/components/category-select";
import type { ProjectOption } from "@/components/project-select";

type TaskStatusValue = "todo" | "in_progress" | "in_review" | "done";
type TaskPriorityValue = "low" | "medium" | "high" | "urgent";

export type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: Date | null;
  subtasks: { id: string; title: string; completed: boolean }[];
};

export function TaskRow({
  task,
  categories,
  projects,
}: {
  task: TaskRowData;
  categories: CategoryOption[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const done = task.status === "done";
  const overdue =
    task.dueDate && !done && isPast(task.dueDate) && !isToday(task.dueDate);
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;

  return (
    <>
      <TableRow className={cn(isPending && "opacity-60")}>
        <TableCell className="w-10">
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
        </TableCell>
        <TableCell>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="text-left"
          >
            <span
              className={cn(
                "font-medium",
                done && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </span>
            {task.subtasks.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                {subtaskDone}/{task.subtasks.length}
              </span>
            )}
            {task.project && (
              <div className="text-xs text-muted-foreground">
                {task.project.name}
              </div>
            )}
          </button>
        </TableCell>
        <TableCell>
          {task.category && <CategoryBadge category={task.category} />}
        </TableCell>
        <TableCell>
          <PriorityBadge priority={task.priority} />
        </TableCell>
        <TableCell>
          {task.dueDate && (
            <span
              className={cn(
                "text-sm",
                overdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {format(task.dueDate, "MMM d")}
            </span>
          )}
        </TableCell>
        <TableCell className="w-20">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${task.title}`}
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon />
            </Button>
            <DeleteConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${task.title}`}
                >
                  <TrashIcon />
                </Button>
              }
              title="Delete this task?"
              description={`"${task.title}" will be permanently deleted.`}
              onConfirm={() => deleteTask(task.id)}
            />
          </div>
        </TableCell>
      </TableRow>
      <TaskDialog
        categories={categories}
        projects={projects}
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
