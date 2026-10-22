import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { lines: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "Void") {
    return NextResponse.json({ error: "Void invoices cannot be edited." }, { status: 400 });
  }

  const body = await req.json();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const lines: { description: string; quantity: number; unit: string; rate: number; amount: number }[] = [];

  if (Array.isArray(body.lines) && body.lines.length > 0) {
    for (const line of body.lines) {
      const quantity = Number(line.quantity);
      const rate = Number(line.rate);
      const description = String(line.description || "").trim();
      if (!description || !quantity || quantity <= 0 || Number.isNaN(rate) || rate < 0) {
        return NextResponse.json({ error: "Each line needs a description, hours greater than zero, and a valid rate." }, { status: 400 });
      }
      lines.push({
        description,
        quantity,
        unit: line.unit || "hours",
        rate,
        amount: Math.round(quantity * rate * 100) / 100,
      });
    }
  } else if (body.equipment?.id) {
    const hours = Number(body.equipment.hours);
    if (!hours || hours <= 0) {
      return NextResponse.json({ error: "Enter machine hours greater than zero." }, { status: 400 });
    }
    const equipment = await prisma.equipment.findFirst({
      where: { id: body.equipment.id, organizationId: orgId },
    });
    if (!equipment) return NextResponse.json({ error: "Equipment not found" }, { status: 400 });
    if (equipment.hourlyRate <= 0) {
      return NextResponse.json({ error: "Selected equipment has no hourly rate configured." }, { status: 400 });
    }
    lines.push({
      description: `${equipment.name} (${equipment.unitNumber}) – machine hours`,
      quantity: hours,
      unit: "hours",
      rate: equipment.hourlyRate,
      amount: Math.round(hours * equipment.hourlyRate * 100) / 100,
    });
  }

  if (Array.isArray(body.attachments)) {
    for (const item of body.attachments) {
      const hours = Number(item.hours);
      if (!hours || hours <= 0) continue;
      const attachment = await prisma.attachment.findFirst({
        where: { id: item.id, organizationId: orgId },
      });
      if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 400 });
      if (attachment.rate <= 0) {
        return NextResponse.json({ error: `Attachment ${attachment.name} has no rate configured.` }, { status: 400 });
      }
      lines.push({
        description: `${attachment.name} – attachment hours`,
        quantity: hours,
        unit: "hours",
        rate: attachment.rate,
        amount: Math.round(hours * attachment.rate * 100) / 100,
      });
    }
  }

  if (Array.isArray(body.otherCharges)) {
    for (const charge of body.otherCharges) {
      const amount = Number(charge.amount);
      if (!amount || amount <= 0) continue;
      const description = String(charge.description || "").trim();
      if (!description) {
        return NextResponse.json({ error: "Other charges need a description." }, { status: 400 });
      }
      lines.push({
        description,
        quantity: 1,
        unit: "each",
        rate: amount,
        amount,
      });
    }
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "Add a machine, attachment, or other charge." }, { status: 400 });
  }

  const subtotal = Math.round(
    lines.reduce((sum: number, line: { amount: number }) => sum + line.amount, 0) * 100
  ) / 100;
  const taxAmount = Math.round(subtotal * (org.taxRate || 0) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  if (total + 0.01 < invoice.amountPaid) {
    return NextResponse.json({
      error: `New total ($${total.toFixed(2)}) is less than amount already paid ($${invoice.amountPaid.toFixed(2)}).`,
    }, { status: 400 });
  }

  let status = invoice.status;
  if (invoice.amountPaid >= total - 0.01) status = "Paid";
  else if (invoice.amountPaid > 0) status = "Partially Paid";
  else if (status === "Paid") status = "Issued";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: {
        notes: body.notes ?? invoice.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : invoice.dueDate,
        subtotal,
        taxRate: org.taxRate,
        taxAmount,
        total,
        status,
        lines: { create: lines },
      },
      include: { lines: true, customer: true, payments: true },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: orgId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Payments and lines cascade via schema
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
