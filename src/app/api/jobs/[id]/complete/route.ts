import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { validateHourMeterUpdate } from "@/lib/maintenance";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.job.findFirst({
    where: { id, organizationId: orgId },
    include: { equipment: true, invoice: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status === "Completed") {
    return NextResponse.json({ error: "Job is already completed." }, { status: 409 });
  }

  const body = await req.json();
  const actualHours = body.actualHours != null ? Number(body.actualHours) : null;
  const actualAttachmentHours = body.actualAttachmentHours != null ? Number(body.actualAttachmentHours) : null;
  const drivingHours = body.drivingHours != null ? Number(body.drivingHours) : null;
  const fuelLiters = body.fuelLiters != null ? Number(body.fuelLiters) : null;
  const fuelCost = body.fuelCost != null ? Number(body.fuelCost) : null;

  if (actualHours != null && (isNaN(actualHours) || actualHours < 0)) {
    return NextResponse.json({ error: "Actual hours must be a non-negative number." }, { status: 400 });
  }
  if (fuelCost != null && (isNaN(fuelCost) || fuelCost < 0)) {
    return NextResponse.json({ error: "Fuel cost must be a non-negative number." }, { status: 400 });
  }

  // If equipment and actual hours, validate against current hour meter (hours added, not absolute)
  let newHourMeter: number | null = null;
  if (job.equipment && actualHours != null && actualHours > 0) {
    const current = job.equipment.hourMeter ?? 0;
    newHourMeter = current + actualHours;
    const check = validateHourMeterUpdate(job.equipment.hourMeter, newHourMeter);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const j = await tx.job.update({
      where: { id },
      data: {
        status: "Completed",
        completedAt,
        endDate: body.endDate ? new Date(body.endDate) : job.endDate,
        actualHours,
        actualAttachmentHours,
        drivingHours,
        fuelLiters,
        fuelCost,
        completionNotes: body.completionNotes || null,
        attachmentUsage: Array.isArray(body.attachments) ? body.attachments : null,
      },
      include: { customer: true, equipment: true, invoice: true },
    });

    if (job.equipment && newHourMeter != null) {
      await tx.equipment.update({
        where: { id: job.equipment.id },
        data: { hourMeter: newHourMeter },
      });
    }

    return j;
  });

  return NextResponse.json(updated);
}
