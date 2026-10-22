import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    where: { organizationId: orgId },
    include: { customer: true, equipment: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const start = body.startDate ? new Date(body.startDate) : null;
  const end = body.endDate ? new Date(body.endDate) : null;

  // Simple conflict check
  if (body.equipmentId && start && end) {
    const conflict = await prisma.job.findFirst({
      where: {
        organizationId: orgId,
        equipmentId: body.equipmentId,
        status: { not: "Cancelled" },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (conflict && !body.override) {
      return NextResponse.json({ error: "Equipment already scheduled in that window", conflictId: conflict.id }, { status: 409 });
    }
  }

  const job = await prisma.job.create({
    data: {
      title: body.title,
      organizationId: orgId,
      customerId: body.customerId,
      equipmentId: body.equipmentId || null,
      startDate: start,
      endDate: end,
      location: body.location,
      notes: body.notes,
      status: "Scheduled",
    },
    include: { customer: true, equipment: true },
  });

  return NextResponse.json(job);
}
