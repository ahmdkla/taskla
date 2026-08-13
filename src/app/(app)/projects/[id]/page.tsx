import { notFound } from "next/navigation";
import { PlusIcon, ListChecksIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge, CategoryBadge } from "@/components/badges";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskDialog } from "../../tasks/task-dialog";
import { TaskRow } from "../../tasks/task-row";
import { format } from "date-fns";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  if (!project) {
    notFound();
  }

  const [tasks, categories, projects] = await Promise.all([
    db.task.findMany({
      where: { userId: user.id, projectId: project.id },
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

  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        actions={
          <TaskDialog
            categories={categories}
            projects={projects}
            defaultProjectId={project.id}
            trigger={
              <Button>
                <PlusIcon />
                New task
              </Button>
            }
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ProjectStatusBadge status={project.status} />
        {project.category && <CategoryBadge category={project.category} />}
        {project.dueDate && (
          <span className="text-sm text-muted-foreground">
            Due {format(project.dueDate, "MMM d, yyyy")}
          </span>
        )}
        <div className="flex min-w-40 flex-1 items-center gap-2">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground">
            {done}/{tasks.length}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <ComingSoon
          icon={ListChecksIcon}
          message="No tasks in this project yet."
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
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
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
