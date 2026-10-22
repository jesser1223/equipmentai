import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.job.findFirst({ where: { id, organizationId: orgId }, include: { invoice: true } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (job.invoice) {
    return NextResponse.json({ error: "Cannot delete a job that has an invoice. Void or remove the invoice first." }, { status: 409 });
  }
  if (job.status === "Completed") {
    return NextResponse.json({ error: "Completed jobs cannot be deleted. They are part of your history." }, { status: 409 });
  }

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
