import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { calculateTotalCost, validateHourMeterUpdate } from "@/lib/maintenance";

export async function GET(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId");

  const where: any = { organizationId: orgId };
  if (equipmentId) where.equipmentId = equipmentId;

  const records = await prisma.maintenanceRecord.findMany({
    where,
    include: { equipment: { select: { id: true, name: true, unitNumber: true } } },
    orderBy: { serviceDate: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { equipmentId, serviceDate, hourMeterAtService, category, description, partsCost, labourCost, otherCost, notes, nextServiceHours, nextServiceDate } = body;

    if (!equipmentId || !serviceDate || !category) {
      return NextResponse.json({ error: "equipmentId, serviceDate, and category are required." }, { status: 400 });
    }

    const equipment = await prisma.equipment.findFirst({
      where: { id: equipmentId, organizationId: orgId },
    });
    if (!equipment) return NextResponse.json({ error: "Equipment not found." }, { status: 404 });

    const meterCheck = validateHourMeterUpdate(equipment.hourMeter, hourMeterAtService != null ? Number(hourMeterAtService) : null);
    if (!meterCheck.ok) return NextResponse.json({ error: meterCheck.error }, { status: 400 });

    const totalCost = calculateTotalCost(partsCost, labourCost, otherCost);

    const record = await prisma.maintenanceRecord.create({
      data: {
        equipmentId,
        organizationId: orgId,
        serviceDate: new Date(serviceDate),
        hourMeterAtService: hourMeterAtService != null ? Number(hourMeterAtService) : null,
        category: String(category),
        description: description || null,
        partsCost: Number(partsCost) || 0,
        labourCost: Number(labourCost) || 0,
        otherCost: Number(otherCost) || 0,
        totalCost,
        notes: notes || null,
        nextServiceHours: nextServiceHours != null ? Number(nextServiceHours) : null,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
      },
      include: { equipment: { select: { id: true, name: true, unitNumber: true } } },
    });

    // Update equipment hour meter and last/next maintenance if provided
    const updates: any = {};
    if (hourMeterAtService != null) updates.hourMeter = Number(hourMeterAtService);
    updates.lastMaintenanceDate = new Date(serviceDate);
    if (nextServiceDate) updates.nextMaintenanceDue = new Date(nextServiceDate);
    if (Object.keys(updates).length) {
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: updates,
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create maintenance record." }, { status: 400 });
  }
}
