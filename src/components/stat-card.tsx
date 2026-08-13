import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "destructive" | "success";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-brand/10 text-brand",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            toneClasses[tone]
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
