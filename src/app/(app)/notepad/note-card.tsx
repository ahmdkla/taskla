"use client";

import { format } from "date-fns";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { NoteDialog } from "./note-dialog";
import { deleteNote } from "@/lib/actions/notes";

type NoteRecord = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
};

export function NoteCard({ note }: { note: NoteRecord }) {
  return (
    <Card>
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
          <DeleteConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${note.title}`}
              >
                <TrashIcon />
              </Button>
            }
            title="Delete this note?"
            description={`"${note.title}" will be permanently deleted.`}
            onConfirm={() => deleteNote(note.id)}
          />
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
