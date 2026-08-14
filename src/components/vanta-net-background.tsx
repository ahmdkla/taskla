"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type VantaNetEffect = { destroy: () => void };

const PALETTE = {
  light: { color: 0x2563eb, backgroundColor: 0xfafafa },
  dark: { color: 0x3b82f6, backgroundColor: 0x0b0b0d },
};

const PRESETS = {
  // Login / signup: present, but calmer than a full-density mesh.
  vivid: {
    points: 7.0,
    maxDistance: 18.0,
    spacing: 24.0,
    opacityClass: "opacity-60",
  },
  // Inside the app: barely-there texture behind the cards.
  subtle: {
    points: 4.5,
    maxDistance: 12.0,
    spacing: 32.0,
    opacityClass: "opacity-10",
  },
} as const;

export function VantaNetBackground({
  variant = "vivid",
}: {
  variant?: keyof typeof PRESETS;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaNetEffect | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let cancelled = false;
    const palette = resolvedTheme === "dark" ? PALETTE.dark : PALETTE.light;
    const preset = PRESETS[variant];
    const vivid = variant === "vivid";

    Promise.all([
      import("vanta/dist/vanta.net.min"),
      import("three"),
    ]).then(([mod, THREE]) => {
      if (cancelled || !containerRef.current) return;
      const NET = (mod as { default: (opts: object) => VantaNetEffect })
        .default;

      effectRef.current = NET({
        el: containerRef.current,
        THREE,
        mouseControls: vivid,
        touchControls: vivid,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        backgroundAlpha: 0,
        color: palette.color,
        points: preset.points,
        maxDistance: preset.maxDistance,
        spacing: preset.spacing,
        showDots: true,
      });
    });

    return () => {
      cancelled = true;
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, [mounted, resolvedTheme, variant]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10",
        PRESETS[variant].opacityClass
      )}
    />
  );
}
