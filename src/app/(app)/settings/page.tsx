import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { CategoryList } from "./category-list";
import { ThemeSelector } from "./theme-selector";
import { SecurityForm } from "./security-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const categories = await db.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  const categoryRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    taskCount: c._count.tasks,
  }));

  return (
    <>
      <PageHeader title="Settings" description="Profile, categories, and appearance." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} email={user.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <SecurityForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList categories={categoryRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
