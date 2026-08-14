"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type VantaNetEffect = { destroy: () => void };

const PALETTE = {
  light: { color: 0x2563eb, backgroundColor: 0xfafafa },
  dark: { color: 0x3b82f6, backgroundColor: 0x0b0b0d },
};

export function VantaNetBackground({
  variant = "vivid",
}: {
  variant?: "vivid" | "subtle";
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
        points: vivid ? 11.0 : 7.0,
        maxDistance: vivid ? 22.0 : 16.0,
        spacing: vivid ? 16.0 : 24.0,
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
        variant === "subtle" && "opacity-25"
      )}
    />
  );
}
