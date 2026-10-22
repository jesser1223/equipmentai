import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: orgId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newPaid = invoice.amountPaid + amount;
  if (newPaid > invoice.total + 0.01) {
    return NextResponse.json({ error: "Payment exceeds balance" }, { status: 400 });
  }

  await prisma.payment.create({
    data: {
      invoiceId: id,
      amount,
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    },
  });

  const status = newPaid >= invoice.total - 0.01 ? "Paid" : "Partially Paid";
  const updated = await prisma.invoice.update({
    where: { id },
    data: { amountPaid: newPaid, status },
    include: { payments: true },
  });

  return NextResponse.json(updated);
}
