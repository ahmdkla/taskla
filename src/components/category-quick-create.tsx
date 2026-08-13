"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createCategory } from "@/lib/actions/categories";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; name: string; color: string };

export function CategoryQuickCreate({
  onCreated,
}: {
  onCreated?: (category: CategoryOption) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", color);
    startTransition(async () => {
      const result = await createCategory(undefined, formData);
      if (result && "category" in result) {
        setName("");
        setColor(CATEGORY_COLORS[0]);
        setOpen(false);
        router.refresh();
        onCreated?.(result.category);
        return;
      }
      setError(
        result?.errors?.name?.[0] ?? result?.message ?? "Something went wrong."
      );
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="New category"
          />
        }
      >
        <PlusIcon />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Health"
              autoFocus
              required
            />
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
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Creating…" : "Create category"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
