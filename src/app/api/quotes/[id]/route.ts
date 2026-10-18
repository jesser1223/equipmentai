import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
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
