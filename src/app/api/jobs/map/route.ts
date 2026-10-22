import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

export async function GET() {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    let lat = job.latitude;
    let lng = job.longitude;
    if (lat == null || lng == null) {
      const point = await geocodeAddress(address);
      if (!point) {
        unresolved.push(address);
        continue;
      }
      lat = point.lat;
      lng = point.lng;
      await prisma.job.update({ where: { id: job.id }, data: { latitude: lat, longitude: lng } });
    }

    markers.push({
      id: job.id,
      lat,
      lng,
      label: job.title,
      address,
      customer: job.customer?.name || "",
      status: job.status,
      href: "/schedule",
    });
  }

  return NextResponse.json({ markers, unresolved });
}
