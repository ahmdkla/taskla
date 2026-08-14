import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickTaskDialog } from "@/components/quick-task-dialog";
import { HelpButton } from "@/components/help-button";

export function AppTopbar() {
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />
      <HelpButton />
      <QuickTaskDialog />
      <ThemeToggle />
    </header>
  );
}
