import { NextResponse } from "next/server";
import { accessBlock, accessMessage, canAccessApp } from "@/lib/access";

export function blockedOrganizationResponse(session: { user?: any } | null) {
  const user = session?.user as any;
  if (!user) return null;
  if (canAccessApp(user.organizationStatus, !!user.isOwner)) return null;
  return NextResponse.json(
    { error: accessMessage(user.organizationStatus), code: accessBlock(user.organizationStatus) },
    { status: 403 }
  );
}
