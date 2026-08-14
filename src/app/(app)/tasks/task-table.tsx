"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquareIcon,
  CheckIcon,
  TrashIcon,
  XIcon,
  CircleDotIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskRow, type TaskRowData } from "./task-row";
import {
  bulkComplete,
  bulkDelete,
  bulkSetStatus,
  restoreTasks,
} from "@/lib/actions/tasks";
import type { CategoryOption } from "@/components/category-select";
import type { ProjectOption } from "@/components/project-select";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

export function TaskTable({
  tasks,
  categories,
  projects,
  editParam,
}: {
  tasks: TaskRowData[];
  categories: CategoryOption[];
  projects: ProjectOption[];
  editParam?: string;
}) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectionMode) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectionMode(false);
        setSelected(new Set());
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectionMode]);

  function exitSelection() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.id))
    );
  }

  const ids = Array.from(selected);

  function handleBulkComplete() {
    startTransition(async () => {
      await bulkComplete(ids);
      router.refresh();
      toast.success(`${ids.length} task${ids.length === 1 ? "" : "s"} completed`);
      exitSelection();
    });
  }

  function handleBulkStatus(status: string) {
    startTransition(async () => {
      await bulkSetStatus(ids, status);
      router.refresh();
      toast.success(
        `${ids.length} task${ids.length === 1 ? "" : "s"} updated`
      );
      exitSelection();
    });
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const payloads = await bulkDelete(ids);
      router.refresh();
      exitSelection();
      if (payloads.length > 0) {
        toast(`${payloads.length} task${payloads.length === 1 ? "" : "s"} deleted`, {
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                await restoreTasks(payloads);
                router.refresh();
              });
            },
          },
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {selectionMode ? (
          <Button variant="outline" size="sm" onClick={exitSelection}>
            <XIcon />
            Cancel selection
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectionMode(true)}
          >
            <CheckSquareIcon />
            Select
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                {selectionMode && (
                  <Checkbox
                    checked={selected.size === tasks.length && tasks.length > 0}
                    aria-label="Select all tasks"
                    onCheckedChange={toggleAll}
                  />
                )}
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                categories={categories}
                projects={projects}
                autoOpenEdit={task.id === editParam}
                selectionMode={selectionMode}
                selected={selected.has(task.id)}
                onToggleSelected={() => toggleOne(task.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {selectionMode && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-popover px-3 py-2 shadow-lg">
          <span className="px-1 text-sm font-medium">
            {selected.size} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleBulkComplete}
          >
            <CheckIcon />
            Complete
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="sm" variant="outline" disabled={isPending} />
              }
            >
              <CircleDotIcon />
              Status
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleBulkStatus(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={handleBulkDelete}
          >
            <TrashIcon />
            Delete
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Cancel selection"
            onClick={exitSelection}
          >
            <XIcon />
          </Button>
        </div>
      )}
    </div>
  );
}
