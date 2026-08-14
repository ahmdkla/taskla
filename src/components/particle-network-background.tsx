"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const BRAND_HEX = { light: "37, 99, 235", dark: "59, 130, 246" }; // --brand as r,g,b

const PRESETS = {
  // Login / signup: meant to be noticed.
  vivid: {
    count: 55,
    linkDistance: 140,
    speed: 0.55,
    lineAlpha: 0.32,
    dotAlpha: 0.6,
    dotRadius: 1.8,
  },
  // Inside the app: ambient texture, must stay out of the way of real work.
  subtle: {
    count: 32,
    linkDistance: 120,
    speed: 0.22,
    lineAlpha: 0.08,
    dotAlpha: 0.2,
    dotRadius: 1.4,
  },
} as const;

type Particle = { x: number; y: number; vx: number; vy: number };

export function ParticleNetworkBackground({
  variant = "vivid",
}: {
  variant?: keyof typeof PRESETS;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preset = PRESETS[variant];
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = resolvedTheme === "dark" ? BRAND_HEX.dark : BRAND_HEX.light;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let visible = true;

    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles = Array.from({ length: preset.count }, () => {
        const angle = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * preset.speed,
          vy: Math.sin(angle) * preset.speed,
        };
      });
    }

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          p.x = Math.max(0, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < preset.linkDistance) {
            const alpha = (1 - dist / preset.linkDistance) * preset.lineAlpha;
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = `rgba(${rgb}, ${preset.dotAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, preset.dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      drawFrame();
      if (!prefersReducedMotion && visible) {
        animationFrame = requestAnimationFrame(loop);
      }
    }

    function handleVisibility() {
      visible = document.visibilityState === "visible";
      if (visible && !prefersReducedMotion) {
        animationFrame = requestAnimationFrame(loop);
      }
    }

    resize();
    seed();
    drawFrame();
    if (!prefersReducedMotion) {
      animationFrame = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [resolvedTheme, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    />
  );
}
