"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "./note-dialog";
import { deleteNote, restoreNote } from "@/lib/actions/notes";
import { cn } from "@/lib/utils";

type NoteRecord = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
};

export function NoteCard({ note }: { note: NoteRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const payload = await deleteNote(note.id);
      router.refresh();
      if (payload) {
        toast("Note deleted", {
          description: note.title,
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                await restoreNote(payload);
                router.refresh();
              });
            },
          },
        });
      }
    });
  }

  return (
    <Card className={cn(isPending && "opacity-60")}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{note.title}</p>
          <p className="text-xs text-muted-foreground">
            Updated {format(note.updatedAt, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NoteDialog
            note={note}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${note.title}`}
              >
                <PencilIcon />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${note.title}`}
            onClick={handleDelete}
          >
            <TrashIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
          {note.content || "No content."}
        </p>
      </CardContent>
    </Card>
  );
}
