import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplies = await prisma.supply.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(supplies);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const cost = Number(body.costPrice) || 0;
    const markup = body.markupPercent !== undefined ? Number(body.markupPercent) : 10;
    const customerPrice = Math.round(cost * (1 + markup / 100) * 100) / 100;

    const supply = await prisma.supply.create({
      data: {
        name: body.name,
        description: body.description || null,
        category: body.category || null,
        unit: body.unit || "each",
        costPrice: cost,
        markupPercent: markup,
        customerPrice,
        active: body.active !== false,
        organizationId: orgId,
      },
    });
    return NextResponse.json(supply, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create supply" }, { status: 400 });
  }
}
