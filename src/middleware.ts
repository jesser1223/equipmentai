import { auth } from "@/auth.config";
import { NextResponse } from "next/server";
import { accessMessage, canAccessApp } from "@/lib/access";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/reset-password", "/pending", "/denied"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p)) || path.startsWith("/api/auth") || path.startsWith("/api/signup");
  const isOwner = !!(req.auth?.user as any)?.isOwner;

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && (path.startsWith("/login") || path.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Super-admin gate for /admin pages. Admin APIs enforce this again on the server.
  if (path.startsWith("/admin")) {
    if (!isOwner) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  // Block non-approved companies from operational pages and APIs.
  // Owner keeps access so approval cannot lock the owner out.
  if (
    isLoggedIn &&
    !isPublic &&
    !isOwner &&
    !path.startsWith("/admin") &&
    !path.startsWith("/api/admin") &&
    !path.startsWith("/pending") &&
    !path.startsWith("/denied")
  ) {
    const status = (req.auth?.user as any)?.organizationStatus;
    if (!canAccessApp(status, false)) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: accessMessage(status) }, { status: 403 });
      }
      if (status === "Pending") {
        return NextResponse.redirect(new URL("/pending", req.nextUrl));
      }
      return NextResponse.redirect(new URL("/denied", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
