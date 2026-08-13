const STATUS_META: Record<
  string,
  { label: string; barClass: string; dotClass: string }
> = {
  todo: { label: "To do", barClass: "bg-muted-foreground/30", dotClass: "bg-muted-foreground/50" },
  in_progress: { label: "In progress", barClass: "bg-brand", dotClass: "bg-brand" },
  in_review: { label: "In review", barClass: "bg-warning", dotClass: "bg-warning" },
  done: { label: "Done", barClass: "bg-success", dotClass: "bg-success" },
};

const ORDER = ["todo", "in_progress", "in_review", "done"];

export function StatusBreakdown({ counts }: { counts: Record<string, number> }) {
  const total = ORDER.reduce((sum, key) => sum + (counts[key] ?? 0), 0);

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No tasks yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {ORDER.map((key, i) => {
          const value = counts[key] ?? 0;
          if (value === 0) return null;
          const width = (value / total) * 100;
          return (
            <div
              key={key}
              className={`${STATUS_META[key].barClass} ${i > 0 ? "ml-0.5" : ""}`}
              style={{ width: `${width}%` }}
              title={`${STATUS_META[key].label}: ${value}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {ORDER.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className={`size-2 rounded-full ${STATUS_META[key].dotClass}`} />
            <span className="text-muted-foreground">{STATUS_META[key].label}</span>
            <span className="font-medium">{counts[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
