"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { HabitDialog } from "../habit-dialog";
import { deleteHabit, setHabitArchived } from "@/lib/actions/habits";
import type { CategoryOption } from "@/components/category-select";

export function HabitActions({
  habit,
  categories,
  archived,
}: {
  habit: {
    id: string;
    name: string;
    why: string | null;
    color: string;
    categoryId: string | null;
  };
  categories: CategoryOption[];
  archived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <HabitDialog
        categories={categories}
        habit={habit}
        trigger={
          <Button variant="outline" size="sm" aria-label={`Edit ${habit.name}`}>
            <PencilIcon />
            Edit
          </Button>
        }
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setHabitArchived(habit.id, !archived);
            router.refresh();
            toast.success(archived ? "Habit resumed" : "Habit archived");
          })
        }
      >
        {archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
        {archived ? "Resume" : "Archive"}
      </Button>
      <DeleteConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${habit.name}`}
          >
            <TrashIcon />
          </Button>
        }
        title="Delete this habit?"
        description={`"${habit.name}" and its whole history will be permanently deleted. Archiving keeps the record instead.`}
        onConfirm={async () => {
          await deleteHabit(habit.id);
          router.push("/habits");
        }}
      />
    </div>
  );
}
