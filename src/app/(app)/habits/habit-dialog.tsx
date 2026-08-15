"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createHabit,
  updateHabit,
  type HabitFormState,
} from "@/lib/actions/habits";
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
import {
  CategorySelect,
  type CategoryOption,
} from "@/components/category-select";
import { cn } from "@/lib/utils";

type HabitRecord = {
  id: string;
  name: string;
  why: string | null;
  color: string;
  categoryId: string | null;
};

const EXAMPLES = [
  "Workout at home 15 minutes",
  "Read the book 10 pages",
  "Drink milk",
];

export function HabitDialog({
  categories,
  habit,
  trigger,
}: {
  categories: CategoryOption[];
  habit?: HabitRecord;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const action = habit ? updateHabit.bind(null, habit.id) : createHabit;
  const [state, formAction, pending] = useActionState<HabitFormState, FormData>(
    action,
    undefined
  );

  const [color, setColor] = useState(habit?.color ?? CATEGORY_COLORS[0]);
  const [categoryId, setCategoryId] = useState(habit?.categoryId ?? "none");

  const prevPending = useRef(false);
  useEffect(() => {
    if (prevPending.current && !pending && !state?.errors && !state?.message) {
      setOpen(false);
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state, router]);

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setColor(habit?.color ?? CATEGORY_COLORS[0]);
      setCategoryId(habit?.categoryId ?? "none");
    }
    prevOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>
            Something you want to do every day. Today counts as day 1.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Habit</Label>
            <Input
              id="habit-name"
              name="name"
              defaultValue={habit?.name}
              placeholder={EXAMPLES[0]}
              required
              autoFocus
            />
            {state?.errors?.name ? (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            ) : (
              !habit && (
                <p className="text-xs text-muted-foreground">
                  e.g. {EXAMPLES.join(" · ")}
                </p>
              )
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-why">Why it matters (optional)</Label>
            <Input
              id="habit-why"
              name="why"
              defaultValue={habit?.why ?? ""}
              placeholder="So I have energy in the afternoon"
            />
            <p className="text-xs text-muted-foreground">
              Shown when you&apos;re tempted to skip.
            </p>
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
                    "size-7 rounded-full ring-offset-2 ring-offset-popover transition",
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

          <div className="space-y-1.5">
            <Label>Category</Label>
            <CategorySelect
              categories={categories}
              value={categoryId}
              onValueChange={setCategoryId}
            />
            <input type="hidden" name="categoryId" value={categoryId} />
          </div>

          {state?.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : habit ? "Save changes" : "Start habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
