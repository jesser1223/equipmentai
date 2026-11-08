import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const equipment = await prisma.equipment.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [attachments, maintenanceRecords, documents, jobs] = await Promise.all([
    prisma.attachment.findMany({ where: { equipmentId: id, organizationId: orgId } }),
    prisma.maintenanceRecord.findMany({
      where: { equipmentId: id, organizationId: orgId },
      orderBy: { serviceDate: "desc" },
    }),
    prisma.equipmentDocument.findMany({
      where: { equipmentId: id, organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.findMany({
      where: { equipmentId: id, organizationId: orgId },
      orderBy: { startDate: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true, status: true, total: true } },
      },
    }),
  ]);

  const seen = new Set<string>();
  const invoicedRevenue = jobs.reduce((sum, job) => {
    const inv = job.invoice;
    if (!inv || inv.status === "Draft" || inv.status === "Void" || seen.has(inv.id)) return sum;
    seen.add(inv.id);
    return sum + Number(inv.total || 0);
  }, 0);

  return NextResponse.json({
    ...equipment,
    attachments,
    maintenanceRecords,
    documents,
    jobs,
    jobCount: jobs.length,
    invoicedRevenue,
  });
}
