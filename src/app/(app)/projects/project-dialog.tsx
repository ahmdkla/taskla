"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "@/lib/actions/projects";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect, type CategoryOption } from "@/components/category-select";
import { DatePicker } from "@/components/date-picker";

type ProjectStatusValue = "active" | "on_hold" | "completed" | "archived";

type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  status: ProjectStatusValue;
  dueDate: Date | null;
};

const STATUS_OPTIONS: { value: ProjectStatusValue; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectDialog({
  categories,
  project,
  trigger,
}: {
  categories: CategoryOption[];
  project?: ProjectRecord;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const action = project
    ? updateProject.bind(null, project.id)
    : createProject;
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(action, undefined);

  const [categoryId, setCategoryId] = useState(project?.categoryId ?? "none");
  const [status, setStatus] = useState<ProjectStatusValue>(
    project?.status ?? "active"
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    project?.dueDate ?? undefined
  );

  const prevPending = useRef(false);
  useEffect(() => {
    if (prevPending.current && !pending && !state?.errors && !state?.message) {
      setOpen(false);
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state, router]);

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setCategoryId(project?.categoryId ?? "none");
      setStatus(project?.status ?? "active");
      setDueDate(project?.dueDate ?? undefined);
    }
    prevOpen.current = open;
    // Only reset fields on the closed -> open transition, not on every
    // `project` prop change (e.g. from router.refresh() while still open).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            Group related tasks together and track progress.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              name="name"
              defaultValue={project?.name}
              required
              autoFocus
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              name="description"
              defaultValue={project?.description ?? ""}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatusValue)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: ProjectStatusValue) =>
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

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : project
                  ? "Save changes"
                  : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
