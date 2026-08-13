import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/dal";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { TutorialProvider } from "@/components/tutorial-provider";
import { TutorialCard } from "@/components/tutorial-card";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar user={user} />
      <SidebarInset>
        <TutorialProvider initiallyOpen={!user.tutorialSeen}>
          <AppTopbar />
          <div className="flex-1 p-4 md:p-6">
            <TutorialCard />
            {children}
          </div>
        </TutorialProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
