import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickTaskDialog } from "@/components/quick-task-dialog";
import { HelpButton } from "@/components/help-button";

export function AppTopbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />
      <HelpButton />
      <QuickTaskDialog />
      <ThemeToggle />
    </header>
  );
}
