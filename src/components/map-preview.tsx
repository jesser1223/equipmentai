"use client";

import { Component, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./map-inner"), { ssr: false });

type Marker = { id: string; lat: number; lng: number; label: string; address: string; matched?: string; customer: string; status: string };

class MapBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">Map failed to load. Reload the page.</div>;
    }
    return this.props.children;
  }
}

export function MapPreview() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    setReady(true);
  }, []);

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
      {loading || !ready ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Finding the street address…</div>
      ) : error ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-danger">{error}</div>
      ) : (
        <MapBoundary>
          <MapInner locations={markers} />
        </MapBoundary>
      )}
      {unresolved.length > 0 && (
        <div className="absolute left-3 top-3 z-10 max-w-sm rounded-md bg-black/75 px-3 py-2 text-[11px] text-white/90 backdrop-blur-sm">
          Could not match the street: {unresolved.join("; ")}
        </div>
      )}
      {!loading && markers.length === 0 && unresolved.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">
          No job addresses yet. Add a street address and city.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
        Job sites · street match
      </div>
    </div>
  );
}
