import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { normalizeTaxRate, quoteTaxAmount, quoteTotal, quoteTransitionError } from "@/lib/quotes";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
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
  if (body.status && body.status !== quote.status) {
    const transitionError = quoteTransitionError(quote.status, body.status, !!quote.job);
    if (transitionError) return NextResponse.json({ error: transitionError }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: body.customerId || quote.customerId, organizationId: orgId, archivedAt: null },
  });
  if (!customer && body.customerId && body.customerId !== quote.customerId) {
    return NextResponse.json({ error: "Customer not found or archived." }, { status: 400 });
  }

  if (body.status && !body.lines) {
    const updated = await prisma.quote.update({
      where: { id },
      data: { status: body.status },
      include: { lines: true, customer: true, job: true },
    });
    return NextResponse.json(updated);
  }

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
  const taxRate = normalizeTaxRate(body.taxRate != null ? Number(body.taxRate) : quote.taxRate);
  const taxAmount = quoteTaxAmount(subtotal, taxRate);
  const total = quoteTotal(subtotal, taxRate);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.quoteLine.deleteMany({ where: { quoteId: id } });
    return tx.quote.update({
      where: { id },
      data: {
        customerId: body.customerId || quote.customerId,
        jobName: body.jobName || quote.jobName,
        location: body.location ?? quote.location,
        notes: body.notes ?? quote.notes,
        status: body.status && !quoteTransitionError(quote.status, body.status, !!quote.job) ? body.status : quote.status,
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
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
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
