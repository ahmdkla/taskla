"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViewToggle({ view }: { view: "table" | "board" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(next: "table" | "board") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "table") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      className="flex rounded-lg border border-border p-0.5"
      role="radiogroup"
      aria-label="View"
    >
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="icon-sm"
        role="radio"
        aria-checked={view === "table"}
        aria-label="Table view"
        onClick={() => setView("table")}
      >
        <ListIcon />
      </Button>
      <Button
        variant={view === "board" ? "secondary" : "ghost"}
        size="icon-sm"
        role="radio"
        aria-checked={view === "board"}
        aria-label="Board view"
        onClick={() => setView("board")}
      >
        <LayoutGridIcon />
      </Button>
    </div>
  );
}
