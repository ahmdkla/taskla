"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { CATEGORY_COLORS } from "@/lib/category-colors";

const CategorySchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(40),
  color: z.enum(CATEGORY_COLORS, { error: "Pick a color." }),
});

export type CategoryFormState =
  | {
      errors: { name?: string[]; color?: string[] };
      message?: undefined;
    }
  | {
      errors?: undefined;
      message: string;
    }
  | { category: { id: string; name: string; color: string } }
  | undefined;

export async function createCategory(
  _state: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const session = await verifySession();

  const validatedFields = CategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, color } = validatedFields.data;

  const existing = await db.category.findUnique({
    where: { userId_name: { userId: session.userId, name } },
  });
  if (existing) {
    return { message: "You already have a category with that name." };
  }

  const category = await db.category.create({
    data: { userId: session.userId, name, color },
    select: { id: true, name: true, color: true },
  });

  revalidatePath("/", "layout");
  return { category };
}

export async function updateCategory(
  categoryId: string,
  _state: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const session = await verifySession();

  const validatedFields = CategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const category = await db.category.findFirst({
    where: { id: categoryId, userId: session.userId },
  });
  if (!category) {
    return { message: "Category not found." };
  }

  const { name, color } = validatedFields.data;

  await db.category.update({
    where: { id: categoryId },
    data: { name, color },
  });

  revalidatePath("/", "layout");
}

export async function deleteCategory(categoryId: string) {
  const session = await verifySession();

  await db.category.deleteMany({
    where: { id: categoryId, userId: session.userId },
  });

  revalidatePath("/", "layout");
}
