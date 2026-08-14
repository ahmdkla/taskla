import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/session";
import { db } from "@/lib/db";

/** Tolerance for the iat-vs-passwordChangedAt comparison. JWT `iat` is floored
 *  to whole seconds and the re-issued session is created just after the DB
 *  timestamp is written, so a small slack keeps the user who just changed
 *  their password from logging themselves out. Kept tight (not tens of
 *  seconds) so a stolen session is actually revoked promptly. */
const PASSWORD_CHANGE_SKEW_MS = 2_000;

export const verifySession = cache(async () => {
  const session = await getSessionPayload();

  if (!session?.userId) {
    redirect("/login");
  }

  // Sessions issued before the last password change are dead — this is what
  // makes a password reset actually revoke a stolen 30-day cookie.
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { passwordChangedAt: true },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.passwordChangedAt && session.iat) {
    const issuedAtMs = session.iat * 1000 + PASSWORD_CHANGE_SKEW_MS;
    if (issuedAtMs < user.passwordChangedAt.getTime()) {
      // Route through the handler that clears the cookie — redirecting to
      // /login directly would loop, since the proxy still sees a
      // validly-signed cookie and would send us back here.
      redirect("/api/auth/expired");
    }
  }

  return { isAuth: true, userId: session.userId };
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      tutorialSeen: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
});
