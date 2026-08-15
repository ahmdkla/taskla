"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  FlameIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  NotebookPenIcon,
  SettingsIcon,
  TimerIcon,
  ChartColumnIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { NavUser } from "@/components/nav-user";

const navItems = [
  { title: "Overview", url: "/overview", icon: LayoutDashboardIcon },
  { title: "Tasks", url: "/tasks", icon: ListChecksIcon },
  { title: "Habits", url: "/habits", icon: FlameIcon },
  { title: "Projects", url: "/projects", icon: FolderKanbanIcon },
  { title: "Schedule", url: "/schedule", icon: CalendarIcon },
  { title: "Focus", url: "/focus", icon: TimerIcon },
  { title: "Notepad", url: "/notepad", icon: NotebookPenIcon },
  { title: "Summary", url: "/summary", icon: ChartColumnIcon },
];

type AppSidebarUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export function AppSidebar({ user }: { user: AppSidebarUser }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <Link
          href="/overview"
          className="flex items-center px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Logo className="group-data-[collapsible=icon]:gap-0" wordmarkClassName="group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                    render={<Link href={item.url} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
              render={<Link href="/settings" />}
            >
              <SettingsIcon />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
