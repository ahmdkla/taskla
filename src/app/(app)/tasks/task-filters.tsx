"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption } from "@/components/category-select";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TaskFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const categoryLabels: Record<string, string> = {
    all: "All categories",
    ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
  };
  const priorityLabels: Record<string, string> = Object.fromEntries(
    PRIORITY_OPTIONS.map((o) => [o.value, o.label])
  );
  const statusLabels: Record<string, string> = Object.fromEntries(
    STATUS_OPTIONS.map((o) => [o.value, o.label])
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={searchParams.get("category") ?? "all"}
        onValueChange={(value) => setParam("category", value ?? "all")}
      >
        <SelectTrigger>
          <SelectValue>{(value: string) => categoryLabels[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(value) => setParam("priority", value ?? "all")}
      >
        <SelectTrigger>
          <SelectValue>{(value: string) => priorityLabels[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) => setParam("status", value ?? "all")}
      >
        <SelectTrigger>
          <SelectValue>{(value: string) => statusLabels[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
