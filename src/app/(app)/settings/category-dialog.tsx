"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  type CategoryFormState,
} from "@/lib/actions/categories";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CategoryRecord = { id: string; name: string; color: string };

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: CategoryRecord;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(action, undefined);
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);

  const prevPending = useRef(false);
  useEffect(() => {
    if (
      prevPending.current &&
      !pending &&
      state &&
      (("category" in state) || (!state.errors && !state.message))
    ) {
      setOpen(false);
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state, router]);

  useEffect(() => {
    if (open) setColor(category?.color ?? CATEGORY_COLORS[0]);
  }, [open, category]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Used to tag and filter your tasks and projects.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="settings-category-name">Name</Label>
            <Input
              id="settings-category-name"
              name="name"
              defaultValue={category?.name}
              required
              autoFocus
            />
            {state && "errors" in state && state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-6 rounded-full ring-offset-2 ring-offset-popover transition",
                    color === c && "ring-2 ring-foreground"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>
          {state && "message" in state && state.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : category ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
