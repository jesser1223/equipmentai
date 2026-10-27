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
  const byAttachment: Record<string, { id: string; name: string; totalHours: number; jobCount: number }> = {};

  for (const job of jobs) {
    // Machine hours = actualHours only. Attachment hours are never added here.
    if (job.equipment && job.actualHours != null) {
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

    // Attachment usage is tracked separately from machine hours
    if (Array.isArray(job.attachmentUsage)) {
      for (const att of job.attachmentUsage as any[]) {
        const hours = Number(att.hours) || 0;
        if (hours <= 0 || !att.id) continue;
        if (!byAttachment[att.id]) {
          byAttachment[att.id] = { id: att.id, name: att.name || "Attachment", totalHours: 0, jobCount: 0 };
        }
        byAttachment[att.id].totalHours += hours;
        byAttachment[att.id].jobCount += 1;
      }
    }
  }

  const equipment = Object.values(byEquipment).sort((a, b) => b.totalHours - a.totalHours);
  const attachments = Object.values(byAttachment).sort((a, b) => b.totalHours - a.totalHours);

  return NextResponse.json({
    from,
    to,
    note: "Machine utilization uses actualHours only. Attachment hours are tracked separately and are not added to the machine.",
    equipment,
    attachments,
  });
}
