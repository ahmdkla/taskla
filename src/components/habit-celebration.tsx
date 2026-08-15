"use client";

import { useEffect } from "react";
import { TrophyIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STAGES } from "@/lib/habits";

export function HabitCelebration({
  stage,
  habitName,
  onClose,
}: {
  stage: 1 | 2 | 3 | null;
  habitName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    // Loaded on demand so the confetti bundle never touches first paint.
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const burst = (particleRatio: number, opts: Record<string, unknown>) =>
        confetti({
          origin: { y: 0.6 },
          particleCount: Math.floor(200 * particleRatio),
          ...opts,
        });
      burst(0.25, { spread: 26, startVelocity: 55 });
      burst(0.2, { spread: 60 });
      burst(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      burst(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      burst(0.1, { spread: 120, startVelocity: 45 });
    });

    return () => {
      cancelled = true;
    };
  }, [stage]);

  const def = stage ? STAGES.find((s) => s.stage === stage) : null;

  return (
    <Dialog open={stage !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-warning/15 text-warning">
            <TrophyIcon className="size-7" />
          </div>
          <DialogTitle className="text-center">
            {def?.title} unlocked
          </DialogTitle>
          <DialogDescription className="text-center">
            {def?.blurb}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium">{habitName}</p>
          <p className="text-sm text-muted-foreground">
            {def?.target} completions
            {def?.stage === 3 ? " — this one's yours now." : " and counting."}
          </p>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={onClose}>
            Keep going
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
