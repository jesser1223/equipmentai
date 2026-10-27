import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { calculateJobCharges } from "@/lib/job-billing";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.job.findFirst({
    where: { id, organizationId: orgId },
    include: { equipment: true, invoice: true, customer: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "Completed") {
    return NextResponse.json({ error: "Only completed jobs can be invoiced." }, { status: 400 });
  }
  if (job.invoice) {
    return NextResponse.json({ error: "This job already has an invoice.", invoiceId: job.invoice.id }, { status: 409 });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const attachments = Array.isArray(job.attachmentUsage)
    ? (job.attachmentUsage as any[]).map((a) => ({
        id: a.id,
        name: a.name,
        rate: Number(a.rate) || 0,
        hours: Number(a.hours) || 0,
      }))
    : [];

  const calc = calculateJobCharges({
    equipmentName: job.equipment?.name,
    equipmentUnit: job.equipment?.unitNumber,
    equipmentRate: job.equipment?.hourlyRate,
    actualHours: job.actualHours,
    attachments,
    fuelCost: job.fuelCost,
    taxRate: org.taxRate || 0,
  });

  if (calc.lines.length === 0) {
    return NextResponse.json({
      error: "Cannot create draft. Missing required billing information.",
      missing: calc.missing,
    }, { status: 400 });
  }

  const number = `${org.invoicePrefix}-${String(org.nextInvoiceNum).padStart(4, "0")}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        number,
        status: "Draft",
        organizationId: orgId,
        customerId: job.customerId,
        jobId: job.id,
        notes: job.completionNotes || org.defaultNotes,
        subtotal: calc.subtotal,
        taxRate: calc.taxRate,
        taxAmount: calc.taxAmount,
        total: calc.total,
        lines: { create: calc.lines },
      },
      include: { lines: true, customer: true },
    });
    await tx.organization.update({
      where: { id: orgId },
      data: { nextInvoiceNum: { increment: 1 } },
    });
    return inv;
  });

  return NextResponse.json({ invoice, missing: calc.missing });
}
