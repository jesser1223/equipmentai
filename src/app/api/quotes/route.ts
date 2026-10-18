import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const quotes = await prisma.quote.findMany({
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const count = await prisma.quote.count();
    const number = `Q-${String(count + 1).padStart(4, "0")}`;

    const lines = body.lines || [];
    const subtotal = lines.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);
    const taxRate = Number(body.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const quote = await prisma.quote.create({
      data: {
        number,
        status: body.status || "Draft",
        jobName: body.jobName,
        location: body.location || null,
        proposedDate: body.proposedDate ? new Date(body.proposedDate) : null,
        notes: body.notes || null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        customerId: body.customerId,
        lines: {
          create: lines.map((l: any) => ({
            description: l.description,
            quantity: Number(l.quantity) || 1,
            unit: l.unit || "hours",
            rate: Number(l.rate) || 0,
            amount: Number(l.amount) || 0,
            equipmentId: l.equipmentId || null,
          })),
        },
      },
      include: { lines: true, customer: true },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create quote" }, { status: 400 });
  }
}
