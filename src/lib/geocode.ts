async function searchNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "EquipmentAI/1.0 (https://equipmentai-ppov.vercel.app)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit?.lat || !hit?.lon) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}

async function searchPhoton(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const coords = data?.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return { lat: Number(coords[1]), lng: Number(coords[0]) };
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = address.trim();
  if (!query) return null;

  const attempts = [query];
  if (!/canada|usa|united states/i.test(query)) attempts.push(`${query}, Canada`);
  if (!/vancouver/i.test(query)) attempts.push(`${query}, Vancouver, BC, Canada`);

  for (const attempt of attempts) {
    const photon = await searchPhoton(attempt);
    if (photon) return photon;
    const nominatim = await searchNominatim(attempt);
    if (nominatim) return nominatim;
  }
  return null;
}
