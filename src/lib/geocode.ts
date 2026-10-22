type Point = { lat: number; lng: number; matched: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function parseAddress(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const street = parts[0] || address;
  return {
    street,
    streetName: street.replace(/^\d+\s*/, "").trim(),
    city: parts[1] || "",
    province: parts[2] || "",
    postal: parts[3] || "",
    country: parts[4] || "Canada",
  };
}

async function canadaLocate(query: string): Promise<Point | null> {
  const url = `https://geolocator.api.geo.ca/?q=${encodeURIComponent(query)}&lang=en&keys=locate`;
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const hits = Array.isArray(data) ? data : [];
  const street = hits.find((hit: any) => /street|intersection|address/i.test(hit?.category || "") && hit?.lat && hit?.lng);
  const place = hits.find((hit: any) => hit?.lat && hit?.lng);
  const hit = street || place;
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lng), matched: hit.name || query };
}

export async function geocodeAddress(address: string): Promise<Point | null> {
  const parsed = parseAddress(address);
  const streetQuery = [parsed.streetName, parsed.city, parsed.province].filter(Boolean).join(", ");
  const streetHit = await withTimeout(canadaLocate(streetQuery), 6000);
  if (streetHit) return streetHit;

  const fullHit = await withTimeout(canadaLocate([parsed.street, parsed.city, parsed.province].filter(Boolean).join(", ")), 6000);
  if (fullHit) return fullHit;

  return withTimeout(canadaLocate([parsed.city, parsed.province, "Canada"].filter(Boolean).join(", ")), 6000);
}
