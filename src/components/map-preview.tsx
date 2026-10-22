"use client";

import { Component, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>,
});

type Marker = { id: string; lat: number; lng: number; label: string; address: string; matched?: string; approximate?: boolean; customer: string; status: string };

class MapBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.children ? null : null;
    return this.props.children;
  }
}

export function MapPreview() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    if (document.querySelector("link[data-leaflet]")) {
      setShowMap(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-leaflet", "true");
    link.onload = () => setShowMap(true);
    link.onerror = () => setShowMap(true);
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    fetch("/api/jobs/map")
      .then((r) => r.json())
      .then((data) => {
        setMarkers(Array.isArray(data.markers) ? data.markers : []);
        setUnresolved(Array.isArray(data.unresolved) ? data.unresolved : []);
      })
      .catch(() => setUnresolved(["Could not load job locations."]))
      .finally(() => setLoading(false));
  }, []);

  const approximate = markers.filter((marker) => marker.approximate);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-border bg-card">
      {loading || !showMap ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Finding the job address…</div>
      ) : mapFailed ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">Map could not start. Refresh the page.</div>
      ) : (
        <MapBoundary>
          <MapErrorGuard onError={() => setMapFailed(true)}>
            <MapInner locations={markers} />
          </MapErrorGuard>
        </MapBoundary>
      )}
      {(unresolved.length > 0 || approximate.length > 0) && (
        <div className="absolute left-3 top-3 z-10 max-w-sm rounded-md bg-black/75 px-3 py-2 text-[11px] text-white/90 backdrop-blur-sm">
          {unresolved.length > 0 && <div>Could not locate: {unresolved.join("; ")}</div>}
          {approximate.length > 0 && <div>Approximate pin: exact house number is not in the map data.</div>}
        </div>
      )}
      {!loading && markers.length === 0 && unresolved.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">
          No job addresses yet.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
        Job sites
      </div>
    </div>
  );
}

function MapErrorGuard({ children, onError }: { children: React.ReactNode; onError: () => void }) {
  return <Guard onError={onError}>{children}</Guard>;
}

class Guard extends Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
