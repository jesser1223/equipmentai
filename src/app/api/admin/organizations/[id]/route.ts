import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isConfiguredOwner } from "@/lib/owner";

async function requireOwner() {
  const session = await auth();
  if (!session) return null;
  const userId = (session.user as any)?.id;
  if (!isConfiguredOwner(userId)) return null;
  return { session, userId };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireOwner();
  if (!authResult) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, reason } = await req.json();
  const { id } = await params;

  const updates: any = {};
  if (action === "approve") {
    updates.status = "Approved";
    updates.approvedAt = new Date();
    updates.approvedById = authResult.userId;
  } else if (action === "deny") {
    updates.status = "Denied";
    updates.deniedAt = new Date();
    updates.deniedReason = reason || null;
  } else if (action === "suspend") {
    updates.status = "Suspended";
    updates.suspendedAt = new Date();
  } else if (action === "restore") {
    updates.status = "Approved";
    updates.suspendedAt = null;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const org = await prisma.organization.update({
    where: { id },
    data: updates,
  });

  await prisma.auditLog.create({
    data: {
      organizationId: id,
      adminUserId: authResult.userId,
      action: action.charAt(0).toUpperCase() + action.slice(1),
      reason: reason || null,
    },
  });

  return NextResponse.json(org);
}
