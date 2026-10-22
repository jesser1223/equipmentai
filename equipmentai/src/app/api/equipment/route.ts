import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const equipment = await prisma.equipment.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(equipment);
}

export async function POST(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization associated with this account." }, { status: 400 });
  }

  try {
    const body = await req.json();
    if (!body.name || !body.unitNumber) {
      return NextResponse.json({ error: "Name and unit number are required." }, { status: 400 });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        category: body.category || "General",
        make: body.make || null,
        model: body.model || null,
        year: body.year ? Number(body.year) : null,
        unitNumber: body.unitNumber,
        serialNumber: body.serialNumber || null,
        description: body.description || null,
        hourlyRate: Number(body.hourlyRate) || 0,
        dailyRate: Number(body.dailyRate) || 0,
        status: body.status || "Available",
        location: body.location || null,
        latitude: body.latitude ? Number(body.latitude) : null,
        longitude: body.longitude ? Number(body.longitude) : null,
        hourMeter: body.hourMeter ? Number(body.hourMeter) : null,
        notes: body.notes || null,
        organizationId: orgId,
      },
    });
    return NextResponse.json(equipment, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create equipment. Check that the unit number is unique." }, { status: 400 });
  }
}
