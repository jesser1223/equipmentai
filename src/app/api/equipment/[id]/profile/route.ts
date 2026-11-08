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
    include: {
      attachments: true,
      maintenanceRecords: { orderBy: { serviceDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      jobs: {
        orderBy: { startDate: "desc" },
        include: {
          customer: { select: { id: true, name: true } },
          invoice: { select: { id: true, number: true, status: true, total: true } },
        },
      },
    },
  });
  if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const billed = equipment.jobs
    .map((job) => job.invoice)
    .filter((inv): inv is NonNullable<typeof inv> => !!inv && inv.status !== "Draft" && inv.status !== "Void");
  const seen = new Set<string>();
  const invoicedRevenue = billed.reduce((sum, inv) => {
    if (seen.has(inv.id)) return sum;
    seen.add(inv.id);
    return sum + Number(inv.total || 0);
  }, 0);

  return NextResponse.json({
    ...equipment,
    jobCount: equipment.jobs.length,
    invoicedRevenue,
  });
}
