import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { customerDeleteDecision } from "@/lib/customers";
import { prisma } from "@/lib/prisma";

async function requireCustomer(id: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return { error: blocked };
  if (!orgId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const customer = await prisma.customer.findFirst({ where: { id, organizationId: orgId } });
  if (!customer) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { orgId, customer };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireCustomer(id);
  if (result.error) return result.error;

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: result.orgId },
    include: {
      quotes: { orderBy: { createdAt: "desc" }, include: { job: { select: { id: true, status: true } } } },
      jobs: { orderBy: { startDate: "desc" }, include: { equipment: { select: { name: true, unitNumber: true } } } },
      invoices: { orderBy: { issueDate: "desc" } },
    },
  });
  return NextResponse.json(customer);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireCustomer(id);
  if (result.error) return result.error;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.archived === true) data.archivedAt = new Date();
  if (body.archived === false) data.archivedAt = null;

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    data.name = name;
  }
  if (body.email !== undefined) data.email = String(body.email || "").trim() || null;
  if (body.phone !== undefined) data.phone = String(body.phone || "").trim() || null;
  if (body.company !== undefined) data.company = String(body.company || "").trim() || null;
  if (body.address !== undefined) data.address = String(body.address || "").trim() || null;
  if (body.notes !== undefined) data.notes = String(body.notes || "").trim() || null;

  const updated = await prisma.customer.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireCustomer(id);
  if (result.error) return result.error;

  const [quotes, jobs, invoices] = await Promise.all([
    prisma.quote.count({ where: { customerId: id, organizationId: result.orgId } }),
    prisma.job.count({ where: { customerId: id, organizationId: result.orgId } }),
    prisma.invoice.count({ where: { customerId: id, organizationId: result.orgId } }),
  ]);

  const decision = customerDeleteDecision({ quotes, jobs, invoices });
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.message, canArchive: true }, { status: 409 });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
