"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPassword.bind(null, token),
    undefined
  );

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium">Password updated</p>
          <p className="text-sm text-muted-foreground">
            You can now sign in with your new password. Any other devices were
            signed out.
          </p>
        </div>
        <Button
          className="w-full"
          size="lg"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={state?.errors?.password ? true : undefined}
        />
        {state?.errors?.password ? (
          <ul className="space-y-0.5 text-sm text-destructive">
            {state.errors.password.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            At least 8 characters, with a letter and a number.
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={state?.errors?.confirmPassword ? true : undefined}
        />
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-destructive">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>
      {state?.message && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
          <Link
            href="/forgot-password"
            className="text-sm text-brand hover:underline"
          >
            Request a new link
          </Link>
        </div>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
