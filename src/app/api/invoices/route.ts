import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
    include: { customer: true, job: true, payments: true, lines: true },
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

  const customer = await prisma.customer.findFirst({
    where: { id: body.customerId, organizationId: orgId },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });

  const lines: { description: string; quantity: number; unit: string; rate: number; amount: number }[] = [];

  if (body.equipment?.id) {
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
    const amount = hours * equipment.hourlyRate;
    lines.push({
      description: `${equipment.name} (${equipment.unitNumber}) – machine hours`,
      quantity: hours,
      unit: "hours",
      rate: equipment.hourlyRate,
      amount,
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
      const amount = hours * attachment.rate;
      lines.push({
        description: `${attachment.name} – attachment hours`,
        quantity: hours,
        unit: "hours",
        rate: attachment.rate,
        amount,
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
    return NextResponse.json({ error: "Add at least one charge before creating an invoice." }, { status: 400 });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const taxAmount = Math.round(subtotal * (org.taxRate || 0) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const number = `${org.invoicePrefix}-${String(org.nextInvoiceNum).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      organizationId: orgId,
      customerId: body.customerId,
      jobId: body.jobId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || org.defaultNotes,
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate: org.taxRate,
      taxAmount,
      total,
      lines: { create: lines },
    },
    include: { lines: true, customer: true },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { nextInvoiceNum: org.nextInvoiceNum + 1 },
  });

  return NextResponse.json(invoice);
}
