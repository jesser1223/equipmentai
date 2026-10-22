type Point = { lat: number; lng: number };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function scoreHit(hit: any, street: string): number {
  const type = `${hit?.addresstype || ""} ${hit?.type || ""} ${hit?.class || ""}`.toLowerCase();
  const name = `${hit?.display_name || ""}`.toLowerCase();
  const number = street.match(/\d+/)?.[0];
  let score = 0;
  if (type.includes("house") || type.includes("building") || type.includes("address")) score += 5;
  if (type.includes("road") || type.includes("street") || type.includes("highway")) score += 3;
  if (number && name.includes(number)) score += 4;
  if (type.includes("city") || type.includes("town") || type.includes("administrative")) score -= 3;
  return score;
}

async function nominatim(params: URLSearchParams): Promise<Point | null> {
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "EquipmentAI/1.0 (https://equipmentai-ppov.vercel.app)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!Array.isArray(data) || !data.length) return null;
  const street = params.get("street") || params.get("q") || "";
  const best = [...data].sort((a, b) => scoreHit(b, street) - scoreHit(a, street))[0];
  if (!best?.lat || !best?.lon) return null;
  return { lat: Number(best.lat), lng: Number(best.lon) };
}

export async function geocodeAddress(address: string): Promise<Point | null> {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const street = parts[0] || address;
  const city = parts[1] || "";
  const province = parts[2] || "";
  const postal = parts[3] || "";
  const country = parts[4] || "Canada";

  const structured = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    street,
    country,
  });
  if (city) structured.set("city", city);
  if (province) structured.set("state", province);
  if (postal) structured.set("postalcode", postal);

  const structuredHit = await withTimeout(nominatim(structured), 4000);
  if (structuredHit) return structuredHit;

  const free = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    q: [street, city, province, postal, country].filter(Boolean).join(", "),
  });
  return withTimeout(nominatim(free), 4000);
}
