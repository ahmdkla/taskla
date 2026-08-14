"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SecurityForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prevSuccess = useRef(false);

  useEffect(() => {
    if (state?.success && !prevSuccess.current) {
      toast.success("Password updated", {
        description: "Other devices have been signed out.",
      });
      formRef.current?.reset();
    }
    prevSuccess.current = Boolean(state?.success);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="max-w-sm space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.errors?.currentPassword ? true : undefined}
        />
        {state?.errors?.currentPassword && (
          <p className="text-sm text-destructive">
            {state.errors.currentPassword[0]}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={state?.errors?.newPassword ? true : undefined}
        />
        {state?.errors?.newPassword ? (
          <ul className="space-y-0.5 text-sm text-destructive">
            {state.errors.newPassword.map((error) => (
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
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
