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

type Marker = {
  lat: number;
  lng: number;
  label: string;
  id?: string;
  customer?: string;
  status?: string;
  address?: string;
  startDate?: string;
};

export function MapPreview() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((jobs) => {
        const list = Array.isArray(jobs) ? jobs : [];
        const noCoords = list.filter((j: any) => !j.latitude || !j.longitude).length;
        setMissing(noCoords);

        let filtered = list.filter((j: any) => j.latitude && j.longitude);
        if (filter === "scheduled") filtered = filtered.filter((j: any) => j.status === "Scheduled");
        if (filter === "active") filtered = filtered.filter((j: any) => j.status === "Scheduled" || j.status === "In Progress");
        if (filter === "completed") filtered = filtered.filter((j: any) => j.status === "Completed");

        setMarkers(
          filtered.map((j: any) => ({
            lat: j.latitude,
            lng: j.longitude,
            label: j.title,
            id: j.id,
            customer: j.customer?.name,
            status: j.status,
            address: j.location,
            startDate: j.startDate,
          }))
        );
      })
      .catch(() => setMarkers([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-xl border border-border">
      <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-lg border border-border bg-card/90 p-1 text-xs backdrop-blur">
        {["all", "active", "scheduled", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-2 py-1 capitalize ${filter === f ? "bg-accent text-accent-foreground" : "hover:bg-white/10"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading jobs…</div>
      ) : markers.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No jobs with a job-site location yet.
        </div>
      ) : (
        <MapInner locations={markers} />
      )}

      {missing > 0 && (
        <div className="absolute bottom-3 left-3 rounded bg-card/90 px-2 py-1 text-xs text-muted-foreground">
          {missing} job{missing > 1 ? "s" : ""} missing a job-site location
        </div>
      )}
    </div>
  );
}