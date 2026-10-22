import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotes = await prisma.quote.findMany({
    where: { organizationId: orgId },
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const count = await prisma.quote.count({ where: { organizationId: orgId } });
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
        organization: { connect: { id: orgId } },
        customer: { connect: { id: body.customerId } },
        lines: {
          create: lines.map((l: any) => ({
            description: l.description,
            quantity: Number(l.quantity) || 1,
            unit: l.unit || "hours",
            rate: Number(l.rate) || 0,
            amount: Number(l.amount) || 0,
          })),
        },
      },
      include: { lines: true, customer: true },
    });
    return NextResponse.json(quote, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 400 });
  }
}