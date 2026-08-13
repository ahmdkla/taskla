"use client";

import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { deleteCategory } from "@/lib/actions/categories";
import { CategoryDialog } from "./category-dialog";

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  taskCount: number;
};

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length === 0
            ? "No categories yet."
            : `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
        </p>
        <CategoryDialog
          trigger={
            <Button variant="outline" size="sm">
              <PlusIcon />
              Add category
            </Button>
          }
        />
      </div>
      {categories.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="flex-1 truncate text-sm">{category.name}</span>
              <span className="text-xs text-muted-foreground">
                {category.taskCount} task{category.taskCount === 1 ? "" : "s"}
              </span>
              <CategoryDialog
                category={category}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${category.name}`}
                  >
                    <PencilIcon />
                  </Button>
                }
              />
              <DeleteConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${category.name}`}
                  >
                    <TrashIcon />
                  </Button>
                }
                title="Delete this category?"
                description={`"${category.name}" will be removed. Tasks and projects using it will become uncategorized.`}
                onConfirm={() => deleteCategory(category.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
