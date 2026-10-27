import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

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

  const missing: string[] = [];
  const lines: { description: string; quantity: number; unit: string; rate: number; amount: number }[] = [];

  if (job.equipment) {
    if (job.actualHours == null || job.actualHours <= 0) {
      missing.push("Actual equipment hours");
    } else if (job.equipment.hourlyRate <= 0) {
      missing.push(`Hourly rate for ${job.equipment.name}`);
    } else {
      const amount = Math.round(job.actualHours * job.equipment.hourlyRate * 100) / 100;
      lines.push({
        description: `${job.equipment.name} (${job.equipment.unitNumber}) – machine hours`,
        quantity: job.actualHours,
        unit: "hours",
        rate: job.equipment.hourlyRate,
        amount,
      });
    }
  }

  if (job.fuelCost != null && job.fuelCost > 0) {
    lines.push({
      description: "Fuel",
      quantity: 1,
      unit: "each",
      rate: job.fuelCost,
      amount: job.fuelCost,
    });
  }

  if (lines.length === 0) {
    return NextResponse.json({
      error: "Cannot create draft. Missing required billing information.",
      missing,
    }, { status: 400 });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const taxAmount = Math.round(subtotal * (org.taxRate || 0) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
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
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate: org.taxRate,
        taxAmount,
        total,
        lines: { create: lines },
      },
      include: { lines: true, customer: true },
    });
    await tx.organization.update({
      where: { id: orgId },
      data: { nextInvoiceNum: { increment: 1 } },
    });
    return inv;
  });

  return NextResponse.json({ invoice, missing });
}
