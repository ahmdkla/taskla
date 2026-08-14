"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { createSession } from "@/lib/session";

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

const PasswordSchema = z
  .string()
  .min(8, { error: "Must be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { error: "Must contain at least one letter." })
  .regex(/[0-9]/, { error: "Must contain at least one number." })
  .trim();

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Current password is required." }),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormState =
  | {
      errors?: {
        currentPassword?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function changePassword(
  _state: ChangePasswordFormState,
  formData: FormData
): Promise<ChangePasswordFormState> {
  const session = await verifySession();

  const validatedFields = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { message: "Something went wrong." };

  const currentMatches = await bcrypt.compare(
    validatedFields.data.currentPassword,
    user.passwordHash
  );
  if (!currentMatches) {
    return { errors: { currentPassword: ["That's not your current password."] } };
  }

  const passwordHash = await bcrypt.hash(validatedFields.data.newPassword, 12);
  const passwordChangedAt = new Date();

  await db.user.update({
    where: { id: session.userId },
    data: { passwordHash, passwordChangedAt },
  });

  // Re-issue this session so the user who just changed their password isn't
  // logged out by their own passwordChangedAt check.
  await createSession(session.userId);

  return { success: true };
}
