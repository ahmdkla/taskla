import { PlusIcon, ListChecksIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "./task-dialog";
import { TaskFilters } from "./task-filters";
import { TaskTable } from "./task-table";
import { TaskBoard } from "./task-board";
import { ViewToggle } from "./view-toggle";

type TaskStatusValue = "todo" | "in_progress" | "in_review" | "done";
type TaskPriorityValue = "low" | "medium" | "high" | "urgent";

const STATUS_VALUES: TaskStatusValue[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
];
const PRIORITY_VALUES: TaskPriorityValue[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export default async function TasksPage({
  searchParams,
}: PageProps<"/tasks">) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const priorityParam = typeof params.priority === "string" ? params.priority : undefined;
  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const editParam = typeof params.edit === "string" ? params.edit : undefined;
  const view = params.view === "board" ? "board" : "table";

  const [tasks, categories, projects] = await Promise.all([
    db.task.findMany({
      where: {
        userId: user.id,
        categoryId: categoryParam ? categoryParam : undefined,
        priority: priorityParam && PRIORITY_VALUES.includes(priorityParam as TaskPriorityValue)
          ? (priorityParam as TaskPriorityValue)
          : undefined,
        // The board always shows all statuses as columns.
        status:
          view === "table" &&
          statusParam &&
          STATUS_VALUES.includes(statusParam as TaskStatusValue)
            ? (statusParam as TaskStatusValue)
            : undefined,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
        subtasks: { orderBy: { order: "asc" } },
      },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    db.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    db.project.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const hasFilters = Boolean(categoryParam || priorityParam || statusParam);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="All your tasks, filterable by category, priority, and status."
        actions={
          <TaskDialog
            categories={categories}
            projects={projects}
            trigger={
              <Button>
                <PlusIcon />
                New task
              </Button>
            }
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TaskFilters categories={categories} hideStatus={view === "board"} />
        <div className="ml-auto">
          <ViewToggle view={view} />
        </div>
      </div>
      {tasks.length === 0 ? (
        <ComingSoon
          icon={ListChecksIcon}
          message={
            hasFilters
              ? "No tasks match these filters."
              : "No tasks yet. Create your first task to get started."
          }
        />
      ) : view === "board" ? (
        <TaskBoard
          tasks={tasks}
          categories={categories}
          projects={projects}
          editParam={editParam}
        />
      ) : (
        <TaskTable
          tasks={tasks}
          categories={categories}
          projects={projects}
          editParam={editParam}
        />
      )}
    </>
  );
}
