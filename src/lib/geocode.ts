type Point = { lat: number; lng: number; matched: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function parseAddress(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    street: parts[0] || address,
    city: parts[1] || "",
    province: parts[2] || "",
    postal: parts[3] || "",
    country: parts[4] || "Canada",
    number: (parts[0] || address).match(/\d+/)?.[0] || "",
  };
}

async function photon(query: string, number: string): Promise<Point | null> {
  const url = `https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const features = Array.isArray(data?.features) ? data.features : [];
  const matches = features.filter((feature: any) => {
    const house = String(feature?.properties?.housenumber || "");
    return !number || house === number;
  });
  const hit = (matches[0] || (!number ? features[0] : null));
  const coords = hit?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const props = hit.properties || {};
  return {
    lat: Number(coords[1]),
    lng: Number(coords[0]),
    matched: [props.housenumber, props.street, props.city].filter(Boolean).join(" "),
  };
}

export async function geocodeAddress(address: string): Promise<Point | null> {
  const parsed = parseAddress(address);
  const query = [parsed.street, parsed.city, parsed.province, parsed.postal, parsed.country].filter(Boolean).join(", ");
  return withTimeout(photon(query, parsed.number), 5000);
}
