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
  const equipmentId = searchParams.get("equipmentId");
  const attachmentId = searchParams.get("attachmentId");
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const where: any = { organizationId: orgId, status: "Completed" };
  if (from || to) {
    where.completedAt = {};
    if (from) where.completedAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.completedAt.lte = end;
    }
  }
  if (equipmentId) where.equipmentId = equipmentId;

  const jobs = await prisma.job.findMany({
    where,
    include: { equipment: { select: { id: true, name: true, unitNumber: true, type: true } } },
  });

  const byEquipment: Record<string, { id: string; name: string; unitNumber: string; type: string; totalHours: number; jobCount: number; attachments: Record<string, { id: string; name: string; totalHours: number; jobCount: number }> }> = {};

  for (const job of jobs) {
    if (!job.equipment || job.actualHours == null) continue;
    const id = job.equipment.id;
    if (!byEquipment[id]) {
      byEquipment[id] = {
        id,
        name: job.equipment.name,
        unitNumber: job.equipment.unitNumber,
        type: job.equipment.category || "",
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
        if (attachmentId && att.id !== attachmentId) continue;
        // Attachment hours also count toward the machine total
        byEquipment[id].totalHours += hours;
        if (!byEquipment[id].attachments[att.id]) {
          byEquipment[id].attachments[att.id] = { id: att.id, name: att.name || "Attachment", totalHours: 0, jobCount: 0 };
        }
        byEquipment[id].attachments[att.id].totalHours += hours;
        byEquipment[id].attachments[att.id].jobCount += 1;
      }
    }
  }

  let equipment = Object.values(byEquipment).map((eq) => ({
    ...eq,
    attachments: Object.values(eq.attachments).sort((a, b) => b.totalHours - a.totalHours),
  }));

  if (search) {
    equipment = equipment.filter((eq) =>
      eq.name.toLowerCase().includes(search) ||
      eq.unitNumber.toLowerCase().includes(search) ||
      eq.attachments.some((a) => a.name.toLowerCase().includes(search))
    );
  }
  if (attachmentId) {
    equipment = equipment.filter((eq) => eq.attachments.some((a) => a.id === attachmentId));
  }

  equipment.sort((a, b) => b.totalHours - a.totalHours);

  const totalHours = equipment.reduce((s, e) => s + e.totalHours, 0);
  const totalJobs = equipment.reduce((s, e) => s + e.jobCount, 0);

  return NextResponse.json({
    from,
    to,
    totalHours: Math.round(totalHours * 10) / 10,
    totalJobs,
    equipmentCount: equipment.length,
    note: "Machine hours include actual equipment hours plus attachment hours used on that machine. Attachment hours are also listed under the equipment.",
    equipment,
  });
}
