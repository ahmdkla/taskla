"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = mounted && theme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            role="radio"
            aria-checked={active}
            className={cn(!active && "text-muted-foreground")}
            onClick={() => setTheme(option.value)}
          >
            <Icon />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
