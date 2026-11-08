import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blockedOrganizationResponse } from "@/lib/access-guard";

const UTM = "utm_source=equipmentai&utm_medium=referral";

function withUtm(url: string) {
  if (!url) return url;
  return url.includes("?") ? `${url}&${UTM}` : `${url}?${UTM}`;
}

export async function GET(req: Request) {
  const session = await auth();
  const orgId = (session?.user as any)?.organizationId;
  const blocked = blockedOrganizationResponse(session);
  if (blocked) return blocked;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return NextResponse.json({ error: "Image search is not configured." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const make = (searchParams.get("make") || "").trim();
  const model = (searchParams.get("model") || "").trim();
  if (!make || !model) {
    return NextResponse.json({ error: "Enter the manufacturer and model first." }, { status: 400 });
  }

  const query = `${make} ${model} equipment`;
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, next: { revalidate: 300 } },
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Photo search failed. Try again." }, { status: 502 });
  }
  const data = await res.json();
  const results = (data.results || []).slice(0, 12).map((p: any) => ({
    id: p.id,
    previewUrl: p.urls?.small,
    imageUrl: p.urls?.regular,
    photographer: p.user?.name,
    photographerUrl: withUtm(p.user?.links?.html || ""),
    photoPageUrl: withUtm(p.links?.html || ""),
    downloadLocation: p.links?.download_location,
  }));

  return NextResponse.json({ results, attribution: "Photos from Unsplash" });
}
