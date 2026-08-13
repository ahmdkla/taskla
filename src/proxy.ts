import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";

const publicRoutes = ["/login", "/setup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

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
