"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryQuickCreate } from "@/components/category-quick-create";

export type CategoryOption = { id: string; name: string; color: string };

export function CategorySelect({
  categories,
  value,
  onValueChange,
}: {
  categories: CategoryOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [justCreated, setJustCreated] = useState<CategoryOption[]>([]);
  const allCategories = [
    ...categories,
    ...justCreated.filter((c) => !categories.some((existing) => existing.id === c.id)),
  ];

  return (
    <div className="flex gap-2">
      <Select
        value={value}
        onValueChange={(next) => onValueChange(next ?? "none")}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="No category">
            {(id: string) => {
              const category = allCategories.find((c) => c.id === id);
              if (!category) return "No category";
              return (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </span>
              );
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No category</SelectItem>
          {allCategories.map((category) => (
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
      <CategoryQuickCreate
        onCreated={(category) => {
          setJustCreated((prev) => [...prev, category]);
          onValueChange(category.id);
        }}
      />
    </div>
  );
}
