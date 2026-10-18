import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
    include: { customer: true, job: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const number = `${org.invoicePrefix}-${String(org.nextInvoiceNum).padStart(4, "0")}`;
  const subtotal = (body.lines || []).reduce((s: number, l: any) => s + l.quantity * l.rate, 0);
  const taxAmount = subtotal * (org.taxRate || 0);
  const total = subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      organizationId: orgId,
      customerId: body.customerId,
      jobId: body.jobId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || org.defaultNotes,
      subtotal,
      taxRate: org.taxRate,
      taxAmount,
      total,
      lines: {
        create: (body.lines || []).map((l: any) => ({
          description: l.description,
          quantity: l.quantity,
          unit: l.unit || "hours",
          rate: l.rate,
          amount: l.quantity * l.rate,
        })),
      },
    },
    include: { lines: true, customer: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { nextInvoiceNum: org.nextInvoiceNum + 1 },
  });

  return NextResponse.json(invoice);
}
