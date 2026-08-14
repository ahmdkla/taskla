import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Landing spot for sessions the DAL rejects (e.g. issued before a password
 * change). The proxy only does an optimistic cookie check and can't know the
 * session is stale, so redirecting straight to /login would bounce back to
 * /overview forever. Clearing the cookie here breaks that loop — and route
 * handlers, unlike page renders, are allowed to mutate cookies.
 */
export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
