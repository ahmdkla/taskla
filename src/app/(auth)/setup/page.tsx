import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    redirect("/login");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your Taskla account</CardTitle>
        <CardDescription>
          One-time setup — Taskla is built for a single person: you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SetupForm />
      </CardContent>
    </Card>
  );
}
