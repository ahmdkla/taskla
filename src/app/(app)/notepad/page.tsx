import { PlusIcon, NotebookPenIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "./note-dialog";
import { NoteCard } from "./note-card";

export const dynamic = "force-dynamic";

export default async function NotepadPage() {
  const user = await getCurrentUser();

  const notes = await db.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Notepad"
        description="Freeform notes, separate from your task list."
        actions={
          <NoteDialog
            trigger={
              <Button>
                <PlusIcon />
                New note
              </Button>
            }
          />
        }
      />
      {notes.length === 0 ? (
        <ComingSoon icon={NotebookPenIcon} message="No notes yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </>
  );
}
