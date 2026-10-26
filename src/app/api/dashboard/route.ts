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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const equipment = await prisma.equipment.findMany({
    where: { organizationId: orgId },
    include: {
      maintenanceRecords: { orderBy: { serviceDate: "desc" }, take: 1 },
    },
  });

  let overdueMaintenance = 0;
  let dueSoonMaintenance = 0;
  for (const eq of equipment) {
    const status = computeServiceStatus(eq);
    if (status === "Overdue") overdueMaintenance++;
    else if (status === "Due soon") dueSoonMaintenance++;
  }

  const [
    activeJobs,
    jobsToday,
    unassignedJobs,
    equipmentAvailable,
    unpaidInvoices,
    outstanding,
    todayJobsList,
    recentCompleted,
    recentMaintenance,
    recentQuotes,
    recentInvoices,
  ] = await Promise.all([
    prisma.job.count({ where: { organizationId: orgId, status: { in: ["Scheduled", "In Progress"] } } }),
    prisma.job.count({
      where: {
        organizationId: orgId,
        status: { in: ["Scheduled", "In Progress"] },
        OR: [
          { startDate: { gte: todayStart, lte: todayEnd } },
          { endDate: { gte: todayStart, lte: todayEnd } },
        ],
      },
    }),
    prisma.job.count({
      where: { organizationId: orgId, status: { in: ["Scheduled", "In Progress"] }, equipmentId: null },
    }),
    prisma.equipment.count({ where: { organizationId: orgId, status: "Available" } }),
    prisma.invoice.count({ where: { organizationId: orgId, status: { notIn: ["Paid", "Void"] } } }),
    prisma.invoice.aggregate({
      where: { organizationId: orgId, status: { notIn: ["Paid", "Void"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.job.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["Scheduled", "In Progress"] },
        OR: [
          { startDate: { gte: todayStart, lte: todayEnd } },
          { endDate: { gte: todayStart, lte: todayEnd } },
        ],
      },
      include: { customer: true, equipment: true },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    prisma.job.findMany({
      where: { organizationId: orgId, status: "Completed" },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.maintenanceRecord.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { equipment: { select: { name: true, unitNumber: true } } },
    }),
    prisma.quote.findMany({
      where: { organizationId: orgId, status: "Accepted" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId: orgId, status: { notIn: ["Draft", "Void"] } },
      orderBy: { issueDate: "desc" },
      take: 5,
      include: { customer: true },
    }),
  ]);

  const outstandingBalance = Math.max(0, (outstanding._sum.total || 0) - (outstanding._sum.amountPaid || 0));

  const attention: { type: string; label: string; href: string; count?: number }[] = [];
  if (unassignedJobs > 0) attention.push({ type: "unassigned", label: `${unassignedJobs} job${unassignedJobs === 1 ? "" : "s"} need equipment`, href: "/schedule", count: unassignedJobs });
  if (overdueMaintenance > 0) attention.push({ type: "overdue-maint", label: `${overdueMaintenance} equipment overdue for service`, href: "/equipment", count: overdueMaintenance });
  if (dueSoonMaintenance > 0) attention.push({ type: "due-soon", label: `${dueSoonMaintenance} equipment due soon`, href: "/equipment", count: dueSoonMaintenance });
  if (unpaidInvoices > 0) attention.push({ type: "overdue-invoice", label: `${unpaidInvoices} unpaid invoice${unpaidInvoices === 1 ? "" : "s"}`, href: "/invoices", count: unpaidInvoices });

  const activity = [
    ...recentCompleted.map((j) => ({ type: "job-completed", label: `Job completed: ${j.title}`, time: j.completedAt || j.updatedAt, href: "/schedule" })),
    ...recentMaintenance.map((m) => ({ type: "maintenance", label: `Maintenance: ${m.equipment?.name || "Equipment"}`, time: m.createdAt, href: "/maintenance" })),
    ...recentQuotes.map((q) => ({ type: "quote", label: `Quote accepted: ${q.number}`, time: q.updatedAt, href: "/quotes" })),
    ...recentInvoices.map((i) => ({ type: "invoice", label: `Invoice ${i.number} issued`, time: i.issueDate, href: "/invoices" })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return NextResponse.json({
    activeJobs,
    jobsToday,
    unassignedJobs,
    equipmentAvailable,
    overdueMaintenance,
    dueSoonMaintenance,
    unpaidInvoices,
    outstandingBalance,
    todayJobs: todayJobsList.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      startDate: j.startDate,
      location: j.location,
      customer: j.customer?.name || null,
      equipment: j.equipment ? `${j.equipment.name} (${j.equipment.unitNumber})` : null,
      hasEquipment: !!j.equipmentId,
    })),
    attention,
    recentActivity: activity,
    note: "Recent activity is built from the latest records on jobs, maintenance, quotes, and invoices. It is not a complete audit log.",
  });
}
