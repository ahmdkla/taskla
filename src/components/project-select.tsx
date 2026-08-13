"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProjectOption = { id: string; name: string };

export function ProjectSelect({
  projects,
  value,
  onValueChange,
}: {
  projects: ProjectOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next ?? "none")}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="No project">
          {(id: string) =>
            projects.find((p) => p.id === id)?.name ?? "No project"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No project</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
