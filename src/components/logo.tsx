import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-7", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <path
        d="M9.5 16.8L13.6 21L22.5 11.5"
        className="stroke-brand-foreground"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "text-lg font-semibold tracking-tight text-foreground",
          wordmarkClassName
        )}
      >
        Taskla
      </span>
    </span>
  );
}
