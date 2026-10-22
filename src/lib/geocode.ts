type Point = { lat: number; lng: number; matched: string; approximate: boolean };

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
    number: street.match(/\d+/)?.[0] || "",
  };
}

async function photon(query: string, bias?: { lat: number; lng: number }) {
  const params = new URLSearchParams({ limit: "10", q: query });
  if (bias) {
    params.set("lat", String(bias.lat));
    params.set("lon", String(bias.lng));
  }
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return Array.isArray(data?.features) ? data.features : [];
}

function label(props: any) {
  return [props?.housenumber, props?.name || props?.street, props?.city || props?.locality].filter(Boolean).join(", ");
}

export async function geocodeAddress(address: string): Promise<Point | null> {
  const parsed = parseAddress(address);
  const cityQuery = [parsed.city, parsed.province, parsed.country].filter(Boolean).join(", ");
  const cityHits = await withTimeout(photon(cityQuery || address), 5000);
  const city = cityHits?.find((hit: any) => /city|town|village|locality|hamlet/i.test(hit?.properties?.type || hit?.properties?.osm_value || "")) || cityHits?.[0];
  const cityCoords = city?.geometry?.coordinates;
  const bias = Array.isArray(cityCoords) ? { lat: Number(cityCoords[1]), lng: Number(cityCoords[0]) } : undefined;

  const streetHits = await withTimeout(photon([parsed.streetName, parsed.city, parsed.province].filter(Boolean).join(" "), bias), 5000);
  const wanted = parsed.streetName.toLowerCase();
  const street = streetHits?.find((hit: any) => {
    const name = `${hit?.properties?.name || ""} ${hit?.properties?.street || ""}`.toLowerCase();
    const place = `${hit?.properties?.city || ""} ${hit?.properties?.locality || ""} ${hit?.properties?.state || ""}`.toLowerCase();
    return wanted && name.includes(wanted.split(" ")[0]) && (!parsed.city || place.includes(parsed.city.toLowerCase()) || place.includes("british columbia") || place.includes(parsed.province.toLowerCase()));
  });
  const streetCoords = street?.geometry?.coordinates;
  if (Array.isArray(streetCoords)) {
    return {
      lat: Number(streetCoords[1]),
      lng: Number(streetCoords[0]),
      matched: label(street.properties) || parsed.streetName,
      approximate: !parsed.number || !street?.properties?.housenumber,
    };
  }

  if (bias) {
    return {
      lat: bias.lat,
      lng: bias.lng,
      matched: `${parsed.city || "area"} (town centre, street not in map data)`,
      approximate: true,
    };
  }
  return null;
}
