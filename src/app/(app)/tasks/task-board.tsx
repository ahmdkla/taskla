"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { format, isPast, isToday } from "date-fns";
import { Repeat2Icon } from "lucide-react";
import { PriorityBadge } from "@/components/badges";
import { TaskDialog } from "./task-dialog";
import { setTaskStatus } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import type { TaskRowData } from "./task-row";
import type { CategoryOption } from "@/components/category-select";
import type { ProjectOption } from "@/components/project-select";

type StatusValue = "todo" | "in_progress" | "in_review" | "done";

const COLUMNS: { status: StatusValue; label: string; dotClass: string }[] = [
  { status: "todo", label: "To do", dotClass: "bg-muted-foreground/50" },
  { status: "in_progress", label: "In progress", dotClass: "bg-brand" },
  { status: "in_review", label: "In review", dotClass: "bg-warning" },
  { status: "done", label: "Done", dotClass: "bg-success" },
];

function BoardCard({
  task,
  onOpen,
  dragging = false,
}: {
  task: TaskRowData;
  onOpen?: () => void;
  dragging?: boolean;
}) {
  const done = task.status === "done";
  const overdue =
    task.dueDate && !done && isPast(task.dueDate) && !isToday(task.dueDate);
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50",
        dragging && "shadow-lg ring-2 ring-brand/40"
      )}
    >
      <p
        className={cn(
          "text-sm font-medium",
          done && "text-muted-foreground line-through"
        )}
      >
        {task.title}
        {task.recurrence && (
          <Repeat2Icon
            className="ml-1.5 inline size-3 text-muted-foreground"
            aria-label={`Repeats ${task.recurrence}`}
          />
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.category && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: task.category.color }}
            />
            {task.category.name}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {subtaskDone}/{task.subtasks.length}
          </span>
        )}
        {task.dueDate && (
          <span
            className={cn(
              "ml-auto text-xs",
              overdue ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {format(task.dueDate, "MMM d")}
          </span>
        )}
      </div>
    </button>
  );
}

function DraggableCard({
  task,
  onOpen,
}: {
  task: TaskRowData;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-40")}
    >
      <BoardCard task={task} onOpen={onOpen} />
    </div>
  );
}

function BoardColumn({
  status,
  label,
  dotClass,
  tasks,
  onOpenTask,
}: {
  status: StatusValue;
  label: string;
  dotClass: string;
  tasks: TaskRowData[];
  onOpenTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Fills available width on desktop; falls back to a fixed width that
        // scrolls horizontally on narrow screens.
        "flex w-64 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors lg:w-auto lg:flex-1 lg:shrink",
        isOver && "border-brand/50 bg-brand/5"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn("size-2 rounded-full", dotClass)} />
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function TaskBoard({
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
  const [, startTransition] = useTransition();
  // Optimistic status overrides so a dropped card moves instantly while the
  // server round-trip happens.
  const [overrides, setOverrides] = useState<Record<string, StatusValue>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(
    editParam ?? null
  );

  useEffect(() => {
    // Server data caught up — drop stale overrides.
    setOverrides((prev) => {
      const next: Record<string, StatusValue> = {};
      for (const [id, status] of Object.entries(prev)) {
        const task = tasks.find((t) => t.id === id);
        if (task && task.status !== status) next[id] = status;
      }
      return next;
    });
  }, [tasks]);

  const sensors = useSensors(
    // distance: 5 lets plain clicks through to open the edit dialog.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const effectiveTasks = useMemo(
    () =>
      tasks.map((t) =>
        overrides[t.id] ? { ...t, status: overrides[t.id] } : t
      ),
    [tasks, overrides]
  );

  const byStatus = useMemo(() => {
    const map: Record<StatusValue, TaskRowData[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const task of effectiveTasks) {
      map[task.status].push(task);
    }
    return map;
  }, [effectiveTasks]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = String(over.id) as StatusValue;
    const task = effectiveTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setOverrides((prev) => ({ ...prev, [taskId]: newStatus }));
    startTransition(async () => {
      await setTaskStatus(taskId, newStatus);
      router.refresh();
    });
  }

  const activeTask = activeId
    ? effectiveTasks.find((t) => t.id === activeId)
    : null;
  const openTask = openTaskId
    ? tasks.find((t) => t.id === openTaskId)
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
          <div className="flex min-h-[60vh] gap-3">
            {COLUMNS.map((column) => (
              <BoardColumn
                key={column.status}
                status={column.status}
                label={column.label}
                dotClass={column.dotClass}
                tasks={byStatus[column.status]}
                onOpenTask={setOpenTaskId}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="w-72">
              <BoardCard task={activeTask} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTask && (
        <TaskDialog
          categories={categories}
          projects={projects}
          task={openTask}
          open
          onOpenChange={(open) => {
            if (!open) {
              setOpenTaskId(null);
              if (editParam) router.replace("/tasks?view=board");
            }
          }}
        />
      )}
    </>
  );
}
