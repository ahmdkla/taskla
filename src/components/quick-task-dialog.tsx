"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createTask, type TaskFormState } from "@/lib/actions/tasks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";

type TaskPriorityValue = "low" | "medium" | "high" | "urgent";

const PRIORITY_OPTIONS: { value: TaskPriorityValue; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function QuickTaskDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(
    createTask,
    undefined
  );
  const [priority, setPriority] = useState<TaskPriorityValue>("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const prevPending = useRef(false);
  useEffect(() => {
    if (prevPending.current && !pending && !state?.errors && !state?.message) {
      setOpen(false);
      setPriority("medium");
      setDueDate(undefined);
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <PlusIcon />
            Quick task
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick task</DialogTitle>
          <DialogDescription>
            Capture something fast — you can add details later.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="quick-task-title">Title</Label>
            <Input id="quick-task-title" name="title" required autoFocus />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title[0]}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriorityValue)}
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
          <input type="hidden" name="status" value="todo" />
          <input type="hidden" name="categoryId" value="none" />
          <input type="hidden" name="projectId" value="none" />
          {state?.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
