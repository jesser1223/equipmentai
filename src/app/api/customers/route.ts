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

  const customers = await prisma.customer.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { quotes: true, jobs: true, invoices: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await req.json();
  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      address: body.address || null,
      notes: body.notes || null,
      organizationId: orgId,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
