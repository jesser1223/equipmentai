import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireOwner() {
  const session = await auth();
  const ownerId = process.env.OWNER_USER_ID;
  const userId = (session?.user as any)?.id;
  if (!session || !ownerId || userId !== ownerId) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireOwner();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orgs = await prisma.organization.findMany({
    include: {
      users: { take: 1, orderBy: { createdAt: "asc" } },
      _count: { select: { equipment: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    pending: orgs.filter((o) => o.status === "Pending").length,
    approved: orgs.filter((o) => o.status === "Approved").length,
    denied: orgs.filter((o) => o.status === "Denied").length,
    total: orgs.length,
  };

  return NextResponse.json({ organizations: orgs, counts });
}
