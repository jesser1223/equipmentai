export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = address.trim();
  if (!query) return null;

  const search = async (q: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "EquipmentAI/1.0 (job map)", Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit?.lat || !hit?.lon) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon) };
  };

  const first = await search(query);
  if (first) return first;
  if (!/canada|usa|united states/i.test(query)) {
    return search(`${query}, Canada`);
  }
  return null;
}
