import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const userCount = await db.user.count();
  if (userCount === 0) {
    redirect("/signup");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Taskla workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm />
        <div className="space-y-1.5 text-center text-sm text-muted-foreground">
          <p>
            <Link
              href="/forgot-password"
              className="text-brand hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
