"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createNote, updateNote, type NoteFormState } from "@/lib/actions/notes";
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
import { Textarea } from "@/components/ui/textarea";

type NoteRecord = { id: string; title: string; content: string };

export function NoteDialog({
  note,
  trigger,
}: {
  note?: NoteRecord;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const action = note ? updateNote.bind(null, note.id) : createNote;
  const [state, formAction, pending] = useActionState<NoteFormState, FormData>(
    action,
    undefined
  );

  const prevPending = useRef(false);
  useEffect(() => {
    if (prevPending.current && !pending && !state?.errors && !state?.message) {
      setOpen(false);
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>
            Freeform notes, separate from your task list.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              name="title"
              defaultValue={note?.title}
              required
              autoFocus
            />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title[0]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              name="content"
              defaultValue={note?.content ?? ""}
              rows={8}
            />
          </div>
          {state?.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : note ? "Save changes" : "Create note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
