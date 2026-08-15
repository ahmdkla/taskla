import { TrophyIcon } from "lucide-react";
import { STAGES } from "@/lib/habits";
import { cn } from "@/lib/utils";

export function HabitBadges({
  earnedStages,
  size = "sm",
}: {
  earnedStages: number[];
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage) => {
        const earned = earnedStages.includes(stage.stage);
        return (
          <span
            key={stage.stage}
            title={
              earned
                ? `${stage.title} — ${stage.target} completions`
                : `Locked — reach ${stage.target} completions`
            }
            aria-label={
              earned ? `${stage.title} earned` : `${stage.title} locked`
            }
            className={cn(
              "inline-flex items-center justify-center rounded-full border",
              size === "sm" ? "size-5" : "size-9",
              earned
                ? "border-warning/30 bg-warning/15 text-warning"
                : "border-dashed border-border text-muted-foreground/40"
            )}
          >
            <TrophyIcon className={size === "sm" ? "size-2.5" : "size-4"} />
          </span>
        );
      })}
    </div>
  );
}
