"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const ProfileSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }).max(80),
});

export type ProfileFormState =
  | {
      errors?: { name?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await verifySession();

  const validatedFields = ProfileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  await db.user.update({
    where: { id: session.userId },
    data: { name: validatedFields.data.name },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
