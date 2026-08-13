"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Laugh, Smile, Meh, Frown, CloudRain } from "lucide-react";
import { setTodayMood, type Mood } from "@/lib/actions/daily-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOODS: { value: Mood; icon: typeof Laugh; label: string }[] = [
  { value: "great", icon: Laugh, label: "Great" },
  { value: "good", icon: Smile, label: "Good" },
  { value: "okay", icon: Meh, label: "Okay" },
  { value: "low", icon: Frown, label: "Low" },
  { value: "rough", icon: CloudRain, label: "Rough" },
];

export function MoodPicker({ current }: { current: Mood | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="How are you feeling today?">
      {MOODS.map((mood) => {
        const Icon = mood.icon;
        const active = current === mood.value;
        return (
          <Button
            key={mood.value}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={mood.label}
            aria-pressed={active}
            disabled={isPending}
            className={cn(
              "text-muted-foreground",
              active && "bg-brand/10 text-brand"
            )}
            onClick={() => {
              startTransition(async () => {
                await setTodayMood(mood.value);
                router.refresh();
              });
            }}
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
}
