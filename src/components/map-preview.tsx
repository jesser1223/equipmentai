"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

type Marker = { lat: number; lng: number; label: string; id?: string };

export function MapPreview() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => r.json())
      .then((data) => {
        const list = (Array.isArray(data) ? data : [])
          .filter((e: any) => e.latitude && e.longitude)
          .map((e: any) => ({
            lat: e.latitude,
            lng: e.longitude,
            label: `${e.name} (${e.unitNumber}) — ${e.status}`,
            id: e.id,
          }));
        setMarkers(list);
      })
      .catch(() => setMarkers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-border bg-card">
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading locations…</div>
      ) : markers.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No equipment with coordinates yet. Add latitude/longitude when creating equipment.
        </div>
      ) : (
        <MapInner locations={markers} />
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
        OpenStreetMap · live equipment
      </div>
    </div>
  );
}
