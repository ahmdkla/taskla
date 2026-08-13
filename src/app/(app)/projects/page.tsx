import { PlusIcon, FolderKanbanIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "./project-dialog";
import { ProjectCard } from "./project-card";

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  const [projects, categories] = await Promise.all([
    db.project.findMany({
      where: { userId: user.id },
      include: {
        category: { select: { id: true, name: true, color: true } },
        tasks: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Group related tasks together and track progress."
        actions={
          <ProjectDialog
            categories={categories}
            trigger={
              <Button>
                <PlusIcon />
                New project
              </Button>
            }
          />
        }
      />
      {projects.length === 0 ? (
        <ComingSoon
          icon={FolderKanbanIcon}
          message="No projects yet. Create your first project to start grouping tasks."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              categories={categories}
            />
          ))}
        </div>
      )}
    </>
  );
}
