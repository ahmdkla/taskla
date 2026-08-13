import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <Icon className="size-8" strokeWidth={1.5} />
        <p className="max-w-sm text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
