"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const QuerySchema = z.string().trim().min(2).max(100);

export type SearchResults = {
  tasks: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
  }[];
  projects: { id: string; name: string; status: string }[];
  notes: { id: string; title: string }[];
  habits: { id: string; name: string; color: string }[];
};

const EMPTY: SearchResults = {
  tasks: [],
  projects: [],
  notes: [],
  habits: [],
};

export async function searchAll(query: string): Promise<SearchResults> {
  const session = await verifySession();

  const validated = QuerySchema.safeParse(query);
  if (!validated.success) return EMPTY;
  const q = validated.data;

  const [tasks, projects, notes, habits] = await Promise.all([
    db.task.findMany({
      where: {
        userId: session.userId,
        title: { contains: q, mode: "insensitive" },
      },
      select: { id: true, title: true, status: true, dueDate: true },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    db.project.findMany({
      where: {
        userId: session.userId,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.note.findMany({
      where: {
        userId: session.userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.habit.findMany({
      where: {
        userId: session.userId,
        archivedAt: null,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, color: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
  ]);

  return { tasks, projects, notes, habits };
}
