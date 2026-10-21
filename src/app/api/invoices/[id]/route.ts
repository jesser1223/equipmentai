import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
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

  const incoming = Array.isArray(body.lines) ? body.lines : null;
  if (!incoming || incoming.length === 0) {
    return NextResponse.json({ error: "Add at least one line." }, { status: 400 });
  }

  let lines;
  try {
    lines = incoming.map((line: any) => {
      const quantity = Number(line.quantity);
      const rate = Number(line.rate);
      if (!line.description || !quantity || quantity <= 0 || rate < 0 || Number.isNaN(rate)) {
        throw new Error("Each line needs a description, quantity greater than zero, and a valid rate.");
      }
      const amount = Math.round(quantity * rate * 100) / 100;
      return {
        description: String(line.description).trim(),
        quantity,
        unit: line.unit || "hours",
        rate,
        amount,
      };
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid line items." }, { status: 400 });
  }

  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
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
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: orgId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Payments and lines cascade via schema
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
