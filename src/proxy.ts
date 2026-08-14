import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";

const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Prefix match, not exact: /reset-password/<token> must stay public.
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  const session = await decryptSessionCookie(
    req.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  if (!isPublicRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/overview", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
