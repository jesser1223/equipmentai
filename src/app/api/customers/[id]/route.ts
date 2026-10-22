import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, organizationId: orgId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [quotes, jobs, invoices] = await Promise.all([
    prisma.quote.count({ where: { customerId: id } }),
    prisma.job.count({ where: { customerId: id } }),
    prisma.invoice.count({ where: { customerId: id } }),
  ]);

  if (quotes > 0 || jobs > 0 || invoices > 0) {
    return NextResponse.json(
      { error: `Cannot delete: linked to ${quotes} quote(s), ${jobs} job(s), and ${invoices} invoice(s). Remove those first or archive instead.` },
      { status: 409 }
    );
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
