import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { computeServiceStatus } from "@/lib/maintenance";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const equipment = await prisma.equipment.findMany({
    where: { organizationId: orgId },
    include: {
      maintenanceRecords: {
        orderBy: { serviceDate: "desc" },
        take: 1,
      },
    },
  });

  let overdueCount = 0;
  let dueSoonCount = 0;
  for (const eq of equipment) {
    const status = computeServiceStatus(eq);
    if (status === "Overdue") overdueCount++;
    else if (status === "Due soon") dueSoonCount++;
  }

  const [
    equipmentTotal,
    equipmentAvailable,
    openQuotes,
    unpaidInvoices,
    jobsToday,
    totalCustomers,
  ] = await Promise.all([
    prisma.equipment.count({ where: { organizationId: orgId } }),
    prisma.equipment.count({ where: { organizationId: orgId, status: "Available" } }),
    prisma.quote.count({ where: { organizationId: orgId, status: { in: ["Draft", "Sent"] } } }),
    prisma.invoice.count({ where: { organizationId: orgId, status: { notIn: ["Paid", "Void"] } } }),
    prisma.job.count({ where: { organizationId: orgId, status: { in: ["Scheduled", "In Progress"] } } }),
    prisma.customer.count({ where: { organizationId: orgId } }),
  ]);

  const outstanding = await prisma.invoice.aggregate({
    where: { organizationId: orgId, status: { notIn: ["Paid", "Void"] } },
    _sum: { total: true, amountPaid: true },
  });

  const outstandingBalance = (outstanding._sum.total || 0) - (outstanding._sum.amountPaid || 0);

  return NextResponse.json({
    equipmentTotal,
    equipmentAvailable,
    maintenanceAlerts: overdueCount + dueSoonCount,
    overdueCount,
    dueSoonCount,
    openQuotes,
    unpaidInvoices,
    jobsToday,
    totalCustomers,
    outstandingBalance: Math.max(0, outstandingBalance),
  });
}