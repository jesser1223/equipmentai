import { NextResponse, connection } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

export const maxDuration = 30;

export async function GET() {
  await connection();
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const jobs = await prisma.job.findMany({
      where: { organizationId: orgId, location: { not: null } },
      include: { customer: true },
      orderBy: { startDate: "asc" },
    });

    const markers = [];
    const unresolved: string[] = [];

    for (const job of jobs) {
      const address = (job.location || "").trim();
      if (!address) continue;

      const point = await geocodeAddress(address);
      if (!point) {
        unresolved.push(address);
        continue;
      }

      if (job.latitude !== point.lat || job.longitude !== point.lng) {
        await prisma.job.update({
          where: { id: job.id },
          data: { latitude: point.lat, longitude: point.lng },
        });
      }

      markers.push({
        id: job.id,
        lat: point.lat,
        lng: point.lng,
        label: job.title,
        address,
        matched: point.matched,
        customer: job.customer?.name || "",
        status: job.status,
      });
    }

    return NextResponse.json({ markers, unresolved });
  } catch (err) {
    console.error("[jobs/map]", err);
    return NextResponse.json({ markers: [], unresolved: [], error: "Could not load job locations." }, { status: 200 });
  }
}
