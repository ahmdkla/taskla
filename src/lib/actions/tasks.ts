"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const TaskSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required." }).max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  projectId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : undefined)),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : undefined)),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export type TaskFormState =
  | {
      errors?: {
        title?: string[];
        description?: string[];
        projectId?: string[];
        categoryId?: string[];
        status?: string[];
        priority?: string[];
        dueDate?: string[];
      };
      message?: string;
    }
  | undefined;

function parseTaskForm(formData: FormData) {
  return TaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    projectId: formData.get("projectId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    status: formData.get("status") || "todo",
    priority: formData.get("priority") || "medium",
    dueDate: formData.get("dueDate") || undefined,
  });
}

async function assertOwnedRefs(
  userId: string,
  projectId?: string,
  categoryId?: string
) {
  if (projectId) {
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) return "Project not found.";
  }
  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) return "Category not found.";
  }
  return null;
}

export async function createTask(
  _state: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const session = await verifySession();
  const validatedFields = parseTaskForm(formData);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { title, description, projectId, categoryId, status, priority, dueDate } =
    validatedFields.data;

  const refError = await assertOwnedRefs(session.userId, projectId, categoryId);
  if (refError) return { message: refError };

  await db.task.create({
    data: {
      userId: session.userId,
      title,
      description,
      projectId,
      categoryId,
      status,
      priority,
      dueDate,
      completedAt: status === "done" ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

export async function updateTask(
  taskId: string,
  _state: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const session = await verifySession();
  const validatedFields = parseTaskForm(formData);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
  });
  if (!task) return { message: "Task not found." };

  const { title, description, projectId, categoryId, status, priority, dueDate } =
    validatedFields.data;

  const refError = await assertOwnedRefs(session.userId, projectId, categoryId);
  if (refError) return { message: refError };

  await db.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description ?? null,
      projectId: projectId ?? null,
      categoryId: categoryId ?? null,
      status,
      priority,
      dueDate: dueDate ?? null,
      completedAt:
        status === "done"
          ? (task.completedAt ?? new Date())
          : task.status === "done"
            ? null
            : task.completedAt,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

export async function deleteTask(taskId: string) {
  const session = await verifySession();

  await db.task.deleteMany({
    where: { id: taskId, userId: session.userId },
  });

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

export async function toggleTaskDone(taskId: string) {
  const session = await verifySession();

  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
  });
  if (!task) return;

  const nowDone = task.status !== "done";

  await db.task.update({
    where: { id: taskId },
    data: {
      status: nowDone ? "done" : "todo",
      completedAt: nowDone ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

const SubtaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export async function addSubtask(taskId: string, title: string) {
  const session = await verifySession();
  const validated = SubtaskSchema.safeParse({ title });
  if (!validated.success) return;

  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
  });
  if (!task) return;

  const count = await db.subtask.count({ where: { taskId } });

  await db.subtask.create({
    data: { taskId, title: validated.data.title, order: count },
  });

  revalidatePath("/tasks");
}

export async function toggleSubtask(subtaskId: string) {
  const session = await verifySession();

  const subtask = await db.subtask.findFirst({
    where: { id: subtaskId, task: { userId: session.userId } },
  });
  if (!subtask) return;

  await db.subtask.update({
    where: { id: subtaskId },
    data: { completed: !subtask.completed },
  });

  revalidatePath("/tasks");
}

export async function deleteSubtask(subtaskId: string) {
  const session = await verifySession();

  await db.subtask.deleteMany({
    where: { id: subtaskId, task: { userId: session.userId } },
  });

  revalidatePath("/tasks");
}
