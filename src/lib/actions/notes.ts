"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const NoteSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required." }).max(200),
  content: z.string().trim().max(20000).optional().default(""),
});

export type NoteFormState =
  | {
      errors?: { title?: string[]; content?: string[] };
      message?: string;
    }
  | undefined;

export async function createNote(
  _state: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const session = await verifySession();

  const validatedFields = NoteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") || "",
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { title, content } = validatedFields.data;

  await db.note.create({
    data: { userId: session.userId, title, content },
  });

  revalidatePath("/notepad");
}

export async function updateNote(
  noteId: string,
  _state: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const session = await verifySession();

  const validatedFields = NoteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") || "",
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const note = await db.note.findFirst({
    where: { id: noteId, userId: session.userId },
  });
  if (!note) return { message: "Note not found." };

  const { title, content } = validatedFields.data;

  await db.note.update({
    where: { id: noteId },
    data: { title, content },
  });

  revalidatePath("/notepad");
}

const DeletedNotePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20000),
  createdAt: z.date(),
});

export type DeletedNotePayload = z.infer<typeof DeletedNotePayloadSchema>;

export async function deleteNote(
  noteId: string
): Promise<DeletedNotePayload | undefined> {
  const session = await verifySession();

  const note = await db.note.findFirst({
    where: { id: noteId, userId: session.userId },
  });
  if (!note) return undefined;

  await db.note.deleteMany({
    where: { id: noteId, userId: session.userId },
  });

  revalidatePath("/notepad");

  return {
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
  };
}

export async function restoreNote(payload: DeletedNotePayload) {
  const session = await verifySession();

  // Round-tripped through the client — validate and re-scope to the session.
  const validated = DeletedNotePayloadSchema.safeParse(payload);
  if (!validated.success) return;

  await db.note.create({
    data: {
      userId: session.userId,
      title: validated.data.title,
      content: validated.data.content,
      createdAt: validated.data.createdAt,
    },
  });

  revalidatePath("/notepad");
}
