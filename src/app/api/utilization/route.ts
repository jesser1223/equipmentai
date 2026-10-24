import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {
    organizationId: orgId,
    status: "Completed",
  };
  if (from || to) {
    where.completedAt = {};
    if (from) where.completedAt.gte = new Date(from);
    if (to) where.completedAt.lte = new Date(to);
  }

  const jobs = await prisma.job.findMany({
    where,
    include: { equipment: { select: { id: true, name: true, unitNumber: true } } },
  });

  const byEquipment: Record<string, { id: string; name: string; unitNumber: string; totalHours: number; jobCount: number }> = {};

  for (const job of jobs) {
    if (!job.equipment || job.actualHours == null) continue;
    const id = job.equipment.id;
    if (!byEquipment[id]) {
      byEquipment[id] = {
        id,
        name: job.equipment.name,
        unitNumber: job.equipment.unitNumber,
        totalHours: 0,
        jobCount: 0,
      };
    }
    byEquipment[id].totalHours += job.actualHours;
    byEquipment[id].jobCount += 1;
  }

  const result = Object.values(byEquipment).sort((a, b) => b.totalHours - a.totalHours);

  return NextResponse.json({
    from,
    to,
    note: "Utilization shows total recorded actualHours from completed jobs only. Available hours are not estimated.",
    equipment: result,
  });
}
