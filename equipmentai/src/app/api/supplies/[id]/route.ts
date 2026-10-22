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
  const body = await req.json();

  const existing = await prisma.supply.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cost = body.costPrice !== undefined ? Number(body.costPrice) : existing.costPrice;
  const markup = body.markupPercent !== undefined ? Number(body.markupPercent) : existing.markupPercent;
  const customerPrice = Math.round(cost * (1 + markup / 100) * 100) / 100;

  const updated = await prisma.supply.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      unit: body.unit ?? existing.unit,
      costPrice: cost,
      markupPercent: markup,
      customerPrice,
      active: body.active !== undefined ? body.active : existing.active,
    },
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
  await prisma.supply.updateMany({
    where: { id, organizationId: orgId },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
