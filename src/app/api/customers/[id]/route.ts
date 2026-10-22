import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, organizationId: orgId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [quotes, jobs, invoices] = await Promise.all([
    prisma.quote.findMany({ where: { customerId: id, organizationId: orgId }, select: { id: true } }),
    prisma.job.findMany({ where: { customerId: id, organizationId: orgId }, select: { id: true } }),
    prisma.invoice.findMany({ where: { customerId: id, organizationId: orgId }, select: { id: true } }),
  ]);

  await prisma.$transaction(async (tx) => {
    const invoiceIds = invoices.map((invoice) => invoice.id);
    if (invoiceIds.length) {
      await tx.invoice.deleteMany({ where: { id: { in: invoiceIds }, organizationId: orgId } });
    }
    const jobIds = jobs.map((job) => job.id);
    if (jobIds.length) {
      await tx.job.deleteMany({ where: { id: { in: jobIds }, organizationId: orgId } });
    }
    const quoteIds = quotes.map((quote) => quote.id);
    if (quoteIds.length) {
      await tx.quote.deleteMany({ where: { id: { in: quoteIds }, organizationId: orgId } });
    }
    await tx.customer.delete({ where: { id } });
  });

  return NextResponse.json({
    ok: true,
    deleted: { quotes: quotes.length, jobs: jobs.length, invoices: invoices.length },
  });
}
