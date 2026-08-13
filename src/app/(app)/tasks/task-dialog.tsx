"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTask, updateTask, type TaskFormState } from "@/lib/actions/tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect, type CategoryOption } from "@/components/category-select";
import { ProjectSelect, type ProjectOption } from "@/components/project-select";
import { DatePicker } from "@/components/date-picker";
import { SubtaskManager } from "./subtask-manager";

type TaskStatusValue = "todo" | "in_progress" | "in_review" | "done";
type TaskPriorityValue = "low" | "medium" | "high" | "urgent";

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  categoryId: string | null;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: Date | null;
  subtasks: { id: string; title: string; completed: boolean }[];
};

const STATUS_OPTIONS: { value: TaskStatusValue; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriorityValue; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TaskDialog({
  categories,
  projects,
  task,
  trigger,
  open: controlledOpen,
  onOpenChange,
  defaultProjectId,
}: {
  categories: CategoryOption[];
  projects: ProjectOption[];
  task?: TaskRecord;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const action = task ? updateTask.bind(null, task.id) : createTask;
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(
    action,
    undefined
  );

  const [projectId, setProjectId] = useState(
    task?.projectId ?? defaultProjectId ?? "none"
  );
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? "none");
  const [status, setStatus] = useState<TaskStatusValue>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriorityValue>(
    task?.priority ?? "medium"
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ?? undefined
  );

  const prevPending = useRef(false);
  useEffect(() => {
    if (prevPending.current && !pending && !state?.errors && !state?.message) {
      setOpen(false);
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state, router, setOpen]);

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setProjectId(task?.projectId ?? defaultProjectId ?? "none");
      setCategoryId(task?.categoryId ?? "none");
      setStatus(task?.status ?? "todo");
      setPriority(task?.priority ?? "medium");
      setDueDate(task?.dueDate ?? undefined);
    }
    prevOpen.current = open;
    // Only reset fields on the closed -> open transition, not on every
    // `task` prop change (e.g. from router.refresh() while still open).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Update this task's details."
              : "Add a task to your list."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="task-form"
          action={formAction}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              name="title"
              defaultValue={task?.title}
              required
              autoFocus
            />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              name="description"
              defaultValue={task?.description ?? ""}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatusValue)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: TaskStatusValue) =>
                      STATUS_OPTIONS.find((o) => o.value === v)?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={status} />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as TaskPriorityValue)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: TaskPriorityValue) =>
                      PRIORITY_OPTIONS.find((o) => o.value === v)?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="priority" value={priority} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <ProjectSelect
                projects={projects}
                value={projectId}
                onValueChange={setProjectId}
              />
              <input type="hidden" name="projectId" value={projectId} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <DatePicker value={dueDate} onChange={setDueDate} />
              <input
                type="hidden"
                name="dueDate"
                value={dueDate ? dueDate.toISOString() : ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <CategorySelect
              categories={categories}
              value={categoryId}
              onValueChange={setCategoryId}
            />
            <input type="hidden" name="categoryId" value={categoryId} />
          </div>

          {state?.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
        </form>

        {task && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <Label>Subtasks</Label>
              <SubtaskManager taskId={task.id} subtasks={task.subtasks} />
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="submit" form="task-form" disabled={pending}>
            {pending ? "Saving…" : task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
