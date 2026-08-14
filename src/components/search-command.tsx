"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SearchIcon,
  ListChecksIcon,
  FolderKanbanIcon,
  NotebookPenIcon,
} from "lucide-react";
import { format } from "date-fns";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { TaskStatusBadge } from "@/components/badges";
import { searchAll, type SearchResults } from "@/lib/actions/search";
import type { TaskStatus } from "@/generated/prisma/enums";

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchAll(trimmed);
        setResults(data);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const hasResults =
    results !== null &&
    (results.tasks.length > 0 ||
      results.projects.length > 0 ||
      results.notes.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 w-full max-w-xs items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex dark:bg-input/30 dark:hover:bg-input/50"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
      >
        <SearchIcon className="size-4" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search your tasks, projects, and notes"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search tasks, projects, notes…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim().length < 2 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            ) : isPending && !hasResults ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Searching…
              </p>
            ) : !hasResults ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <>
                {results.tasks.length > 0 && (
                  <CommandGroup heading="Tasks">
                    {results.tasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={`task-${task.id}`}
                        onSelect={() => go(`/tasks?edit=${task.id}`)}
                      >
                        <ListChecksIcon className="text-muted-foreground" />
                        <span className="flex-1 truncate">{task.title}</span>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {format(task.dueDate, "MMM d")}
                          </span>
                        )}
                        <TaskStatusBadge status={task.status as TaskStatus} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {results.projects.length > 0 && (
                  <CommandGroup heading="Projects">
                    {results.projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={`project-${project.id}`}
                        onSelect={() => go(`/projects/${project.id}`)}
                      >
                        <FolderKanbanIcon className="text-muted-foreground" />
                        <span className="flex-1 truncate">{project.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {results.notes.length > 0 && (
                  <CommandGroup heading="Notes">
                    {results.notes.map((note) => (
                      <CommandItem
                        key={note.id}
                        value={`note-${note.id}`}
                        onSelect={() => go("/notepad")}
                      >
                        <NotebookPenIcon className="text-muted-foreground" />
                        <span className="flex-1 truncate">{note.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
