import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/pending", "/denied"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p)) || path.startsWith("/api/auth") || path.startsWith("/api/signup");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && (path.startsWith("/login") || path.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Super-admin gate for /admin
  if (path.startsWith("/admin")) {
    const ownerId = process.env.OWNER_USER_ID;
    const userId = req.auth?.user && (req.auth.user as any).id;
    const email = req.auth?.user?.email;
    const isOwner = ownerId
      ? userId === ownerId
      : email === "admin@equipmentai.com";
    if (!isOwner) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  // Block non-approved companies from operational pages
  if (isLoggedIn && !isPublic && !path.startsWith("/admin") && !path.startsWith("/pending") && !path.startsWith("/denied")) {
    const status = (req.auth?.user as any)?.organizationStatus;
    if (status === "Pending") {
      return NextResponse.redirect(new URL("/pending", req.nextUrl));
    }
    if (status === "Denied" || status === "Suspended") {
      return NextResponse.redirect(new URL("/denied", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
