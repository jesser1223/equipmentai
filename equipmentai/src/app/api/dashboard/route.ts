import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    equipmentTotal,
    equipmentAvailable,
    maintenanceAlerts,
    openQuotes,
    unpaidInvoices,
    jobsToday,
    totalCustomers,
  ] = await Promise.all([
    prisma.equipment.count({ where: { organizationId: orgId } }),
    prisma.equipment.count({ where: { organizationId: orgId, status: "Available" } }),
    prisma.equipment.count({ where: { organizationId: orgId, status: "Maintenance" } }),
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
    maintenanceAlerts,
    openQuotes,
    unpaidInvoices,
    jobsToday,
    totalCustomers,
    outstandingBalance: Math.max(0, outstandingBalance),
  });
}
