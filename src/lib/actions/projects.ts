"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const ProjectSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(80),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : undefined)),
  status: z.enum(["active", "on_hold", "completed", "archived"]),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export type ProjectFormState =
  | {
      errors?: {
        name?: string[];
        description?: string[];
        categoryId?: string[];
        status?: string[];
        dueDate?: string[];
      };
      message?: string;
    }
  | undefined;

function parseProjectForm(formData: FormData) {
  return ProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    status: formData.get("status") || "active",
    dueDate: formData.get("dueDate") || undefined,
  });
}

export async function createProject(
  _state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await verifySession();
  const validatedFields = parseProjectForm(formData);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, description, categoryId, status, dueDate } =
    validatedFields.data;

  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: session.userId },
    });
    if (!category) return { message: "Category not found." };
  }

  await db.project.create({
    data: {
      userId: session.userId,
      name,
      description,
      categoryId,
      status,
      dueDate,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/overview");
}

export async function updateProject(
  projectId: string,
  _state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await verifySession();
  const validatedFields = parseProjectForm(formData);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId },
  });
  if (!project) return { message: "Project not found." };

  const { name, description, categoryId, status, dueDate } =
    validatedFields.data;

  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, userId: session.userId },
    });
    if (!category) return { message: "Category not found." };
  }

  await db.project.update({
    where: { id: projectId },
    data: {
      name,
      description: description ?? null,
      categoryId: categoryId ?? null,
      status,
      dueDate: dueDate ?? null,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/overview");
}

export async function deleteProject(projectId: string) {
  const session = await verifySession();

  await db.project.deleteMany({
    where: { id: projectId, userId: session.userId },
  });

  revalidatePath("/projects");
  revalidatePath("/overview");
}
