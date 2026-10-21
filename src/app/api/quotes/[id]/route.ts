import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, organizationId: orgId },
    include: { job: true },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.job) {
    return NextResponse.json({ error: "This quote has been converted to a job and cannot be edited." }, { status: 409 });
  }

  const body = await req.json();
  const customer = await prisma.customer.findFirst({
    where: { id: body.customerId, organizationId: orgId },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });

  const incoming = Array.isArray(body.lines) ? body.lines : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "Add at least one line." }, { status: 400 });
  }

  let lines: { description: string; quantity: number; unit: string; rate: number; amount: number; equipmentId: string | null }[];
  try {
    lines = incoming.map((line: any) => {
      const quantity = Number(line.quantity) || 0;
      const rate = Number(line.rate) || 0;
      if (!line.description || quantity <= 0 || rate < 0) {
        throw new Error("Each line needs a description, quantity greater than zero, and a valid rate.");
      }
      return {
        description: String(line.description).trim(),
        quantity,
        unit: line.unit || "hours",
        rate,
        amount: Math.round(quantity * rate * 100) / 100,
        equipmentId: line.equipmentId || null,
      };
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid line items." }, { status: 400 });
  }

  const subtotal = Math.round(lines.reduce((sum: number, line: { amount: number }) => sum + line.amount, 0) * 100) / 100;
  const taxRate = Number(body.taxRate) || 0;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.quoteLine.deleteMany({ where: { quoteId: id } });
    return tx.quote.update({
      where: { id },
      data: {
        customerId: body.customerId,
        jobName: body.jobName,
        location: body.location || null,
        notes: body.notes || null,
        taxRate,
        subtotal,
        taxAmount,
        total,
        lines: { create: lines },
      },
      include: { lines: true, customer: true },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findFirst({ where: { id, organizationId: orgId }, include: { job: true } });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (quote.job) {
    return NextResponse.json({ error: "This quote has been converted to a job and cannot be deleted." }, { status: 409 });
  }
  if (quote.status === "Accepted") {
    return NextResponse.json({ error: "Accepted quotes cannot be deleted." }, { status: 409 });
  }

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
