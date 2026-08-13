"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="max-w-sm space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          key={name}
          id="profile-name"
          name="name"
          defaultValue={name}
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Email can&apos;t be changed yet.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state?.success && (
          <span className="text-sm text-success">Saved.</span>
        )}
      </div>
    </form>
  );
}
