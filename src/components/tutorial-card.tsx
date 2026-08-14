"use client";

import { useTransition } from "react";
import {
  XIcon,
  ListChecksIcon,
  TagIcon,
  TimerIcon,
  SearchIcon,
  Repeat2Icon,
  LayoutGridIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dismissTutorial } from "@/lib/actions/tutorial";
import { useTutorial } from "@/components/tutorial-provider";

const TIPS = [
  {
    icon: SearchIcon,
    title: "Find anything fast",
    body: "Press Ctrl+K (⌘K on Mac) to search across your tasks, projects, and notes.",
  },
  {
    icon: ListChecksIcon,
    title: "Capture tasks fast",
    body: "Use Quick task in the top bar to add a task from anywhere in the app.",
  },
  {
    icon: Repeat2Icon,
    title: "Repeat what recurs",
    body: "Set a task to repeat daily, weekly, or monthly — the next one appears when you check it off.",
  },
  {
    icon: LayoutGridIcon,
    title: "Table or board",
    body: "Switch the Tasks page to board view to drag tasks between To do, In progress, In review, and Done.",
  },
  {
    icon: TagIcon,
    title: "Organize with categories",
    body: "Create and manage color-coded categories from Settings, or add one on the fly from any task or project form.",
  },
  {
    icon: TimerIcon,
    title: "Track focus time",
    body: "Run a timer on the Focus page, optionally tied to a task.",
  },
];

export function TutorialCard() {
  const { open, hide } = useTutorial();
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleClose() {
    hide();
    startTransition(async () => {
      await dismissTutorial();
    });
  }

  return (
    <Card className="mb-6 border-brand/30 bg-brand/5">
      <CardContent className="py-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Welcome to Taskla</h2>
            <p className="text-sm text-muted-foreground">
              A quick look at what you can do.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close tutorial"
            onClick={handleClose}
            disabled={isPending}
          >
            <XIcon />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TIPS.map((tip) => (
            <div key={tip.title} className="flex gap-3">
              <tip.icon
                className="mt-0.5 size-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-sm text-muted-foreground">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
