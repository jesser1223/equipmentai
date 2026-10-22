import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

const STATUSES = ["Scheduled", "In Progress", "Completed"];

async function requireJob(id: string): Promise<
  | { error: NextResponse; orgId?: undefined; job?: undefined }
  | { error?: undefined; orgId: string; job: any }
> {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return { error: blocked };
  if (!orgId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const job = await prisma.job.findFirst({ where: { id, organizationId: orgId }, include: { invoice: true } });
  if (!job) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { orgId, job };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireJob(id);
  if (result.error) return result.error;
  const { orgId } = result;

  const body = await req.json();
  const title = String(body.title || "").trim();
  const customerId = String(body.customerId || "");
  if (!title || !customerId) {
    return NextResponse.json({ error: "Job title and customer are required." }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: customerId, organizationId: orgId } });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const equipmentId = body.equipmentId || null;
  if (equipmentId) {
    const equipment = await prisma.equipment.findFirst({ where: { id: equipmentId, organizationId: orgId } });
    if (!equipment) return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
  }

  const status = STATUSES.includes(body.status) ? body.status : "Scheduled";
  const start = body.startDate ? new Date(body.startDate) : null;
  const end = body.endDate ? new Date(body.endDate) : null;
  if (start && end && end < start) {
    return NextResponse.json({ error: "End date cannot be before the start date." }, { status: 400 });
  }

  if (equipmentId && start && end) {
    const conflict = await prisma.job.findFirst({
      where: {
        id: { not: id },
        organizationId: orgId,
        equipmentId,
        status: { not: "Cancelled" },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (conflict && !body.override) {
      return NextResponse.json({ error: "Equipment already scheduled in that window", conflictId: conflict.id }, { status: 409 });
    }
  }

  const location = body.location?.trim() || null;
  const addressChanged = location !== (result.job.location || null);
  const point = location && addressChanged ? await geocodeAddress(location) : null;

  const updated = await prisma.job.update({
    where: { id },
    data: {
      title,
      customerId,
      equipmentId,
      status,
      startDate: start,
      endDate: end,
      location,
      latitude: location ? (point?.lat ?? result.job.latitude) : null,
      longitude: location ? (point?.lng ?? result.job.longitude) : null,
      notes: body.notes || null,
    },
    include: { customer: true, equipment: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireJob(id);
  if (result.error) return result.error;
  const { job } = result;

  if (job.invoice) {
    return NextResponse.json({ error: "Cannot delete a job that has an invoice. Void or remove the invoice first." }, { status: 409 });
  }
  if (job.status === "Completed") {
    return NextResponse.json({ error: "Completed jobs cannot be deleted. They are part of your history." }, { status: 409 });
  }

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
