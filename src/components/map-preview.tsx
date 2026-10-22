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

type Marker = { id: string; lat: number; lng: number; label: string; address: string; customer: string; status: string };

export function MapPreview() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/jobs/map")
      .then((r) => r.json())
      .then((data) => {
        setMarkers(Array.isArray(data.markers) ? data.markers : []);
        setUnresolved(Array.isArray(data.unresolved) ? data.unresolved : []);
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Could not load job locations."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-border bg-card">
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Finding job addresses…</div>
      ) : error ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-danger">{error}</div>
      ) : markers.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          No job addresses yet. Add a job-site address when scheduling a job.
        </div>
      ) : (
        <MapInner locations={markers} />
      )}
      {unresolved.length > 0 && (
        <div className="absolute left-3 top-3 z-10 max-w-xs rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
          Could not locate {unresolved.length} address{unresolved.length === 1 ? "" : "es"}.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
        Job sites · from address
      </div>
    </div>
  );
}
