import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.equipment.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { attachments, ...rest } = body;

    const item = await prisma.equipment.update({
      where: { id },
      data: {
        name: rest.name,
        category: rest.category,
        make: rest.make || null,
        model: rest.model || null,
        year: rest.year ? Number(rest.year) : null,
        unitNumber: rest.unitNumber,
        serialNumber: rest.serialNumber || null,
        description: rest.description || null,
        hourlyRate: Number(rest.hourlyRate) || 0,
        dailyRate: Number(rest.dailyRate) || 0,
        status: rest.status,
        location: rest.location || null,
        latitude: rest.latitude ? Number(rest.latitude) : null,
        longitude: rest.longitude ? Number(rest.longitude) : null,
        hourMeter: rest.hourMeter ? Number(rest.hourMeter) : null,
        notes: rest.notes || null,
      },
    });

    if (Array.isArray(attachments)) {
      await prisma.attachment.deleteMany({ where: { equipmentId: id } });
      if (attachments.length) {
        await prisma.attachment.createMany({
          data: attachments
            .filter((a: any) => a.name)
            .map((a: any) => ({
              name: a.name,
              manufacturer: a.manufacturer || null,
              model: a.model || null,
              serialNumber: a.serialNumber || null,
              billingMethod: a.billingMethod || "hourly",
              rate: Number(a.rate) || 0,
              notes: a.notes || null,
              equipmentId: id,
              organizationId: item.organizationId,
            })),
        });
      }
    }

    const full = await prisma.equipment.findUnique({
      where: { id },
      include: { attachments: true },
    });
    return NextResponse.json(full);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.quoteLine.updateMany({
      where: { equipmentId: id },
      data: { equipmentId: null },
    });
    await prisma.job.updateMany({
      where: { equipmentId: id },
      data: { equipmentId: null },
    });

    await prisma.equipment.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Equipment delete failed:", e);
    return NextResponse.json(
      { error: e.message || "Unable to delete this equipment." },
      { status: 400 }
    );
  }
}
