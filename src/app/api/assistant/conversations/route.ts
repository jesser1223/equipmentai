import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const conversations = await prisma.aiConversation.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
  });
  return NextResponse.json(conversations);
}
