import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, ProjectStatus } from "@/generated/prisma/enums";

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-brand/10 text-brand" },
  high: { label: "High", className: "bg-warning/10 text-warning" },
  urgent: { label: "Urgent", className: "bg-destructive/10 text-destructive" },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
}

const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "To do", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", className: "bg-brand/10 text-brand" },
  in_review: { label: "In review", className: "bg-warning/10 text-warning" },
  done: { label: "Done", className: "bg-success/10 text-success" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = taskStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
}

const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-brand/10 text-brand" },
  on_hold: { label: "On hold", className: "bg-warning/10 text-warning" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = projectStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
}

export function CategoryBadge({
  category,
}: {
  category: { name: string; color: string };
}) {
  return (
    <Badge variant="outline" className="gap-1.5 border-border text-foreground">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </Badge>
  );
}
