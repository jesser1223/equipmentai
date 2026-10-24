import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { calculateTotalCost, validateHourMeterUpdate } from "@/lib/maintenance";

async function requireOwnedRecord(id: string) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return { error: blocked };
  if (!orgId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const record = await prisma.maintenanceRecord.findFirst({
    where: { id, organizationId: orgId },
    include: { equipment: true },
  });
  if (!record) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { orgId, record };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireOwnedRecord(id);
  if (result.error) return result.error;
  return NextResponse.json(result.record);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireOwnedRecord(id);
  if (result.error) return result.error;

  try {
    const body = await req.json();
    const { serviceDate, hourMeterAtService, category, description, partsCost, labourCost, otherCost, notes, nextServiceHours, nextServiceDate } = body;

    const equipment = result.record.equipment;
    const meterCheck = validateHourMeterUpdate(
      equipment.hourMeter,
      hourMeterAtService != null ? Number(hourMeterAtService) : null
    );
    if (!meterCheck.ok) return NextResponse.json({ error: meterCheck.error }, { status: 400 });

    const totalCost = calculateTotalCost(
      partsCost ?? result.record.partsCost,
      labourCost ?? result.record.labourCost,
      otherCost ?? result.record.otherCost
    );

    const updated = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        hourMeterAtService: hourMeterAtService != null ? Number(hourMeterAtService) : undefined,
        category: category != null ? String(category) : undefined,
        description: description !== undefined ? description || null : undefined,
        partsCost: partsCost != null ? Number(partsCost) : undefined,
        labourCost: labourCost != null ? Number(labourCost) : undefined,
        otherCost: otherCost != null ? Number(otherCost) : undefined,
        totalCost,
        notes: notes !== undefined ? notes || null : undefined,
        nextServiceHours: nextServiceHours != null ? Number(nextServiceHours) : undefined,
        nextServiceDate: nextServiceDate !== undefined ? (nextServiceDate ? new Date(nextServiceDate) : null) : undefined,
      },
      include: { equipment: { select: { id: true, name: true, unitNumber: true } } },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Update failed." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireOwnedRecord(id);
  if (result.error) return result.error;

  await prisma.maintenanceRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
