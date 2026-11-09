import { NextResponse } from "next/server";
import { COOKIE, verifySession } from "./lib/session.js";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const protectedPath = pathname.startsWith("/import") || process.env.REQUIRE_LOGIN === "true";
  if (!protectedPath) return NextResponse.next();
  const devOpen = !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";
  if (devOpen || (await verifySession(req.cookies.get(COOKIE)?.value))) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "?next=" + encodeURIComponent(pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!api|_next|login|favicon.ico|template.csv|reviews-template.csv).*)"] };
