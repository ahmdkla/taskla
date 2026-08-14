"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { spawnNextOccurrence } from "@/lib/recurrence";

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
  recurrence: z
    .enum(["none", "daily", "weekly", "monthly"])
    .optional()
    .transform((v) => (v && v !== "none" ? v : undefined)),
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
    recurrence: formData.get("recurrence") || undefined,
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

  const {
    title,
    description,
    projectId,
    categoryId,
    status,
    priority,
    recurrence,
    dueDate,
  } = validatedFields.data;

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
      // A done task never stores a recurrence — spawning happens only on a
      // real not-done -> done transition.
      recurrence: status === "done" ? null : (recurrence ?? null),
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

  const {
    title,
    description,
    projectId,
    categoryId,
    status,
    priority,
    recurrence,
    dueDate,
  } = validatedFields.data;

  const refError = await assertOwnedRefs(session.userId, projectId, categoryId);
  if (refError) return { message: refError };

  const transitionsToDone = task.status !== "done" && status === "done";

  await db.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description ?? null,
      projectId: projectId ?? null,
      categoryId: categoryId ?? null,
      status,
      priority,
      recurrence: status === "done" ? null : (recurrence ?? null),
      dueDate: dueDate ?? null,
      completedAt:
        status === "done"
          ? (task.completedAt ?? new Date())
          : task.status === "done"
            ? null
            : task.completedAt,
    },
  });

  if (transitionsToDone && recurrence) {
    await spawnNextOccurrence({
      id: taskId,
      userId: session.userId,
      title,
      description: description ?? null,
      projectId: projectId ?? null,
      categoryId: categoryId ?? null,
      priority,
      recurrence,
      dueDate: dueDate ?? null,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

const DeletedTaskPayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable(),
  projectId: z.string().nullable(),
  categoryId: z.string().nullable(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  recurrence: z.enum(["daily", "weekly", "monthly"]).nullable(),
  dueDate: z.date().nullable(),
  completedAt: z.date().nullable(),
  order: z.number().int(),
  createdAt: z.date(),
  subtasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        completed: z.boolean(),
        order: z.number().int(),
      })
    )
    .max(200),
  focusSessionIds: z.array(z.string()).max(500),
});

export type DeletedTaskPayload = z.infer<typeof DeletedTaskPayloadSchema>;

export async function deleteTask(
  taskId: string
): Promise<DeletedTaskPayload | undefined> {
  const session = await verifySession();

  // Capture everything needed for undo before the rows disappear.
  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      focusSessions: { select: { id: true } },
    },
  });
  if (!task) return undefined;

  await db.task.deleteMany({
    where: { id: taskId, userId: session.userId },
  });

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");

  return {
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    categoryId: task.categoryId,
    status: task.status,
    priority: task.priority,
    recurrence: task.recurrence,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    order: task.order,
    createdAt: task.createdAt,
    subtasks: task.subtasks.map((s) => ({
      title: s.title,
      completed: s.completed,
      order: s.order,
    })),
    focusSessionIds: task.focusSessions.map((f) => f.id),
  };
}

export async function restoreTask(payload: DeletedTaskPayload) {
  const session = await verifySession();

  // The payload round-tripped through the client, so never trust it for
  // ownership: userId always comes from the session, and refs are re-checked
  // (nulled if they were deleted in the meantime, mirroring onDelete: SetNull).
  const validated = DeletedTaskPayloadSchema.safeParse(payload);
  if (!validated.success) return;
  const data = validated.data;

  const [project, category] = await Promise.all([
    data.projectId
      ? db.project.findFirst({
          where: { id: data.projectId, userId: session.userId },
        })
      : null,
    data.categoryId
      ? db.category.findFirst({
          where: { id: data.categoryId, userId: session.userId },
        })
      : null,
  ]);

  const task = await db.task.create({
    data: {
      userId: session.userId,
      title: data.title,
      description: data.description,
      projectId: project ? data.projectId : null,
      categoryId: category ? data.categoryId : null,
      status: data.status,
      priority: data.priority,
      recurrence: data.recurrence,
      dueDate: data.dueDate,
      completedAt: data.completedAt,
      order: data.order,
      createdAt: data.createdAt,
      subtasks: {
        create: data.subtasks,
      },
    },
  });

  // Relink orphaned focus history (FocusSession.taskId was SetNull on delete).
  if (data.focusSessionIds.length > 0) {
    await db.focusSession.updateMany({
      where: { id: { in: data.focusSessionIds }, userId: session.userId },
      data: { taskId: task.id },
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

export type ToggleTaskResult =
  | {
      completed: true;
      priorStatus: "todo" | "in_progress" | "in_review";
      spawnedTaskId?: string;
      nextDueDate?: Date;
    }
  | { completed: false }
  | undefined;

export async function toggleTaskDone(
  taskId: string
): Promise<ToggleTaskResult> {
  const session = await verifySession();

  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
  });
  if (!task) return undefined;

  if (task.status !== "done") {
    // Conditional update guards against double-completion races (two tabs,
    // double-click) so a recurring task can never spawn twice.
    const result = await db.task.updateMany({
      where: { id: taskId, userId: session.userId, status: { not: "done" } },
      data: { status: "done", completedAt: new Date() },
    });

    let spawned: { id: string; dueDate: Date } | null = null;
    if (result.count === 1 && task.recurrence) {
      spawned = await spawnNextOccurrence(task);
    }

    revalidatePath("/tasks");
    revalidatePath("/overview");
    revalidatePath("/projects");

    return {
      completed: true,
      priorStatus: task.status,
      spawnedTaskId: spawned?.id,
      nextDueDate: spawned?.dueDate,
    };
  }

  await db.task.update({
    where: { id: taskId },
    data: { status: "todo", completedAt: null },
  });

  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");

  return { completed: false };
}

const PriorStatusSchema = z.enum(["todo", "in_progress", "in_review"]);

/**
 * Undo a completion from the toast: restores the prior status, and if the
 * completion spawned a recurring occurrence, deletes it and moves the
 * recurrence back onto the original task.
 */
export async function undoComplete(
  taskId: string,
  priorStatus: string,
  spawnedTaskId?: string
) {
  const session = await verifySession();

  const validated = PriorStatusSchema.safeParse(priorStatus);
  if (!validated.success) return;

  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
  });
  if (!task) return;

  let restoredRecurrence: "daily" | "weekly" | "monthly" | null = null;
  if (spawnedTaskId) {
    const spawned = await db.task.findFirst({
      where: { id: spawnedTaskId, userId: session.userId },
    });
    if (spawned) {
      restoredRecurrence = spawned.recurrence;
      await db.task.deleteMany({
        where: { id: spawnedTaskId, userId: session.userId },
      });
    }
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      status: validated.data,
      completedAt: null,
      ...(restoredRecurrence ? { recurrence: restoredRecurrence } : {}),
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

// --- Status change (kanban) and bulk operations ---

const IdsSchema = z.array(z.string()).min(1).max(100);
const StatusSchema = z.enum(["todo", "in_progress", "in_review", "done"]);

function revalidateTaskPages() {
  revalidatePath("/tasks");
  revalidatePath("/overview");
  revalidatePath("/projects");
}

/** Set one task's status (kanban drop). Routes done-transitions through the
 *  recurrence helper so a dragged recurring task still spawns its next run. */
export async function setTaskStatus(taskId: string, status: string) {
  const session = await verifySession();

  const validatedStatus = StatusSchema.safeParse(status);
  if (!validatedStatus.success) return;
  const next = validatedStatus.data;

  const task = await db.task.findFirst({
    where: { id: taskId, userId: session.userId },
  });
  if (!task || task.status === next) return;

  if (next === "done") {
    const result = await db.task.updateMany({
      where: { id: taskId, userId: session.userId, status: { not: "done" } },
      data: { status: "done", completedAt: new Date() },
    });
    if (result.count === 1 && task.recurrence) {
      await spawnNextOccurrence(task);
    }
  } else {
    await db.task.update({
      where: { id: taskId },
      data: {
        status: next,
        completedAt: task.status === "done" ? null : task.completedAt,
      },
    });
  }

  revalidateTaskPages();
}

export async function bulkSetStatus(taskIds: string[], status: string) {
  const session = await verifySession();

  const validatedIds = IdsSchema.safeParse(taskIds);
  const validatedStatus = StatusSchema.safeParse(status);
  if (!validatedIds.success || !validatedStatus.success) return;
  const next = validatedStatus.data;

  if (next === "done") {
    // Spawn recurring occurrences for tasks actually transitioning to done.
    const recurring = await db.task.findMany({
      where: {
        id: { in: validatedIds.data },
        userId: session.userId,
        status: { not: "done" },
        recurrence: { not: null },
      },
    });

    await db.task.updateMany({
      where: {
        id: { in: validatedIds.data },
        userId: session.userId,
        status: { not: "done" },
      },
      data: { status: "done", completedAt: new Date() },
    });

    for (const task of recurring) {
      await spawnNextOccurrence(task);
    }
  } else {
    await db.task.updateMany({
      where: { id: { in: validatedIds.data }, userId: session.userId },
      data: { status: next },
    });
    // Clear completedAt on tasks leaving done.
    await db.task.updateMany({
      where: {
        id: { in: validatedIds.data },
        userId: session.userId,
        status: next,
        completedAt: { not: null },
      },
      data: { completedAt: null },
    });
  }

  revalidateTaskPages();
}

export async function bulkComplete(taskIds: string[]) {
  await bulkSetStatus(taskIds, "done");
}

export async function bulkDelete(
  taskIds: string[]
): Promise<DeletedTaskPayload[]> {
  const session = await verifySession();

  const validatedIds = IdsSchema.safeParse(taskIds);
  if (!validatedIds.success) return [];

  const tasks = await db.task.findMany({
    where: { id: { in: validatedIds.data }, userId: session.userId },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      focusSessions: { select: { id: true } },
    },
  });
  if (tasks.length === 0) return [];

  await db.task.deleteMany({
    where: { id: { in: tasks.map((t) => t.id) }, userId: session.userId },
  });

  revalidateTaskPages();

  return tasks.map((task) => ({
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    categoryId: task.categoryId,
    status: task.status,
    priority: task.priority,
    recurrence: task.recurrence,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    order: task.order,
    createdAt: task.createdAt,
    subtasks: task.subtasks.map((s) => ({
      title: s.title,
      completed: s.completed,
      order: s.order,
    })),
    focusSessionIds: task.focusSessions.map((f) => f.id),
  }));
}

export async function restoreTasks(payloads: DeletedTaskPayload[]) {
  const capped = payloads.slice(0, 100);
  for (const payload of capped) {
    await restoreTask(payload);
  }
}
