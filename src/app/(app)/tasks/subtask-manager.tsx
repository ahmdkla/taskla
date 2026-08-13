"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { addSubtask, toggleSubtask, deleteSubtask } from "@/lib/actions/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Subtask = { id: string; title: string; completed: boolean };

export function SubtaskManager({
  taskId,
  subtasks,
}: {
  taskId: string;
  subtasks: Subtask[];
}) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    startTransition(async () => {
      await addSubtask(taskId, title);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2">
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={() => {
              startTransition(async () => {
                await toggleSubtask(subtask.id);
                router.refresh();
              });
            }}
          />
          <span
            className={cn(
              "flex-1 text-sm",
              subtask.completed && "text-muted-foreground line-through"
            )}
          >
            {subtask.title}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${subtask.title}`}
            onClick={() => {
              startTransition(async () => {
                await deleteSubtask(subtask.id);
                router.refresh();
              });
            }}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask"
          className="h-8"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon-sm"
          disabled={isPending || !newTitle.trim()}
          aria-label="Add subtask"
        >
          <PlusIcon />
        </Button>
      </form>
    </div>
  );
}
