"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { PencilIcon, Repeat2Icon, TrashIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PriorityBadge, CategoryBadge } from "@/components/badges";
import { TaskDialog } from "./task-dialog";
import {
  deleteTask,
  restoreTask,
  toggleTaskDone,
  undoComplete,
} from "@/lib/actions/tasks";
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
  recurrence: "daily" | "weekly" | "monthly" | null;
  dueDate: Date | null;
  subtasks: { id: string; title: string; completed: boolean }[];
};

export function TaskRow({
  task,
  categories,
  projects,
  autoOpenEdit = false,
  selectionMode = false,
  selected = false,
  onToggleSelected,
}: {
  task: TaskRowData;
  categories: CategoryOption[];
  projects: ProjectOption[];
  autoOpenEdit?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(autoOpenEdit);
  const [isPending, startTransition] = useTransition();

  function handleEditOpenChange(open: boolean) {
    setEditOpen(open);
    if (!open && autoOpenEdit) {
      // Strip the ?edit= deep-link param so a refresh doesn't reopen it.
      router.replace("/tasks");
    }
  }

  const done = task.status === "done";
  const overdue =
    task.dueDate && !done && isPast(task.dueDate) && !isToday(task.dueDate);
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;

  function handleDelete() {
    startTransition(async () => {
      const payload = await deleteTask(task.id);
      router.refresh();
      if (payload) {
        toast("Task deleted", {
          description: task.title,
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                await restoreTask(payload);
                router.refresh();
              });
            },
          },
        });
      }
    });
  }

  return (
    <>
      <TableRow
        className={cn(isPending && "opacity-60", selected && "bg-muted/60")}
      >
        <TableCell className="w-10">
          {selectionMode ? (
            <Checkbox
              checked={selected}
              aria-label={`Select ${task.title}`}
              onCheckedChange={() => onToggleSelected?.()}
            />
          ) : (
            <Checkbox
              checked={done}
              aria-label={done ? "Mark as not done" : "Mark as done"}
              onCheckedChange={() => {
                startTransition(async () => {
                  const result = await toggleTaskDone(task.id);
                  router.refresh();
                  if (result?.completed && result.spawnedTaskId) {
                    toast.success("Task completed", {
                      description: result.nextDueDate
                        ? `Repeats — next one due ${format(result.nextDueDate, "MMM d")}.`
                        : "Repeats — next one created.",
                      action: {
                        label: "Undo",
                        onClick: () => {
                          startTransition(async () => {
                            await undoComplete(
                              task.id,
                              result.priorStatus,
                              result.spawnedTaskId
                            );
                            router.refresh();
                          });
                        },
                      },
                    });
                  }
                });
              }}
            />
          )}
        </TableCell>
        <TableCell>
          <button
            type="button"
            onClick={() =>
              selectionMode ? onToggleSelected?.() : setEditOpen(true)
            }
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
            {task.recurrence && (
              <Repeat2Icon
                className="ml-1.5 inline size-3.5 text-muted-foreground"
                aria-label={`Repeats ${task.recurrence}`}
              />
            )}
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
          {!selectionMode && (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${task.title}`}
                onClick={() => setEditOpen(true)}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${task.title}`}
                onClick={handleDelete}
              >
                <TrashIcon />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
      <TaskDialog
        categories={categories}
        projects={projects}
        task={task}
        open={editOpen}
        onOpenChange={handleEditOpenChange}
      />
    </>
  );
}
