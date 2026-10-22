import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: orgId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Payments and lines cascade via schema
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
