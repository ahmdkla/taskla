"use client";

import Link from "next/link";
import { format } from "date-fns";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge, CategoryBadge } from "@/components/badges";
import { ProjectDialog } from "./project-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { deleteProject } from "@/lib/actions/projects";
import type { CategoryOption } from "@/components/category-select";

type ProjectWithTasks = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "on_hold" | "completed" | "archived";
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  dueDate: Date | null;
  tasks: { status: string }[];
};

export function ProjectCard({
  project,
  categories,
}: {
  project: ProjectWithTasks;
  categories: CategoryOption[];
}) {
  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:underline"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProjectDialog
            categories={categories}
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              categoryId: project.categoryId,
              status: project.status,
              dueDate: project.dueDate,
            }}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${project.name}`}
              >
                <PencilIcon />
              </Button>
            }
          />
          <DeleteConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${project.name}`}
              >
                <TrashIcon />
              </Button>
            }
            title="Delete this project?"
            description={`"${project.name}" will be removed. Its tasks stay, unassigned from any project.`}
            onConfirm={() => deleteProject(project.id)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          {project.category && <CategoryBadge category={project.category} />}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done}/{total} tasks
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        {project.dueDate && (
          <p className="text-xs text-muted-foreground">
            Due {format(project.dueDate, "MMM d, yyyy")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
