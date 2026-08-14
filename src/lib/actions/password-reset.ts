"use server";

import * as z from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail, layoutEmail, appUrl } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const THROTTLE_MS = 2 * 60 * 1000; // one email per user per 2 minutes

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const RequestSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
});

export type RequestResetFormState =
  | { errors?: { email?: string[] }; sent?: boolean }
  | undefined;

export async function requestPasswordReset(
  _state: RequestResetFormState,
  formData: FormData
): Promise<RequestResetFormState> {
  const validated = RequestSchema.safeParse({ email: formData.get("email") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const email = validated.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  // Always report the same result regardless of whether the account exists —
  // otherwise this endpoint becomes an account-enumeration oracle.
  if (!user) return { sent: true };

  const recent = await db.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - THROTTLE_MS) } },
  });
  if (recent) return { sent: true };

  const token = crypto.randomBytes(32).toString("base64url");

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const link = `${appUrl()}/reset-password/${token}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Taskla password",
    html: layoutEmail(
      "Reset your password",
      `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Hi ${user.name}, click the button below to choose a new password. This link expires in 1 hour.</p>
       <p style="margin:0 0 16px;"><a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">Reset password</a></p>
       <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">If you didn't request this, you can safely ignore this email — your password won't change.</p>`
    ),
  });

  return { sent: true };
}

const ResetSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Must be at least 8 characters long." })
      .regex(/[a-zA-Z]/, { error: "Must contain at least one letter." })
      .regex(/[0-9]/, { error: "Must contain at least one number." })
      .trim(),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormState =
  | {
      errors?: { password?: string[]; confirmPassword?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function resetPassword(
  token: string,
  _state: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const validated = ResetSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return {
      message: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const passwordHash = await bcrypt.hash(validated.data.password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      // passwordChangedAt invalidates any session issued before now.
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Deliberately no auto-login: the user re-authenticates with the new password.
  return { success: true };
}
