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

  const byEquipment: Record<string, { id: string; name: string; unitNumber: string; totalHours: number; jobCount: number; attachments: Record<string, { id: string; name: string; totalHours: number; jobCount: number }> }> = {};

  for (const job of jobs) {
    if (job.equipment && job.actualHours != null) {
      const id = job.equipment.id;
      if (!byEquipment[id]) {
        byEquipment[id] = {
          id,
          name: job.equipment.name,
          unitNumber: job.equipment.unitNumber,
          totalHours: 0,
          jobCount: 0,
          attachments: {},
        };
      }
      byEquipment[id].totalHours += job.actualHours;
      byEquipment[id].jobCount += 1;

      if (Array.isArray(job.attachmentUsage)) {
        for (const att of job.attachmentUsage as any[]) {
          const hours = Number(att.hours) || 0;
          if (hours <= 0 || !att.id) continue;
          if (!byEquipment[id].attachments[att.id]) {
            byEquipment[id].attachments[att.id] = { id: att.id, name: att.name || "Attachment", totalHours: 0, jobCount: 0 };
          }
          byEquipment[id].attachments[att.id].totalHours += hours;
          byEquipment[id].attachments[att.id].jobCount += 1;
        }
      }
    }
  }

  const equipment = Object.values(byEquipment)
    .map((eq) => ({ ...eq, attachments: Object.values(eq.attachments).sort((a, b) => b.totalHours - a.totalHours) }))
    .sort((a, b) => b.totalHours - a.totalHours);

  return NextResponse.json({
    from,
    to,
    note: "Machine hours are actualHours only. Attachment hours are listed under the equipment they were used on and are not added to the machine total.",
    equipment,
  });
}
