"use client";

import { useEffect, useRef, useState } from "react";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  address: string;
  matched?: string;
  customer: string;
  status: string;
};

declare global {
  interface Window {
    L?: any;
  }
}

function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-leaflet]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    }
    const existing = document.querySelector("script[data-leaflet]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", () => reject(new Error("Leaflet failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.setAttribute("data-leaflet", "true");
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(script);
  });
}

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");

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

  useEffect(() => {
    if (loading || !mapRef.current) return;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current || !L) return;
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
        const first = markers[0];
        const map = L.map(mapRef.current).setView(first ? [first.lat, first.lng] : [55.76, -120.24], first ? 13 : 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        markers.forEach((marker) => {
          const shortLabel = marker.label.length > 28 ? marker.label.slice(0, 26) + "…" : marker.label;
          const icon = L.divIcon({
            className: "job-pin-label",
            html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
              <div style="background:rgba(15,23,42,0.92);color:#fff;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);white-space:nowrap;margin-bottom:4px;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${shortLabel}</div>
              <div style="width:14px;height:14px;background:#14b8a6;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>
            </div>`,
            iconSize: [120, 36],
            iconAnchor: [60, 36],
          });
          const popup = [
            `<strong>${marker.label}</strong>`,
            marker.customer,
            marker.address,
            marker.status,
          ].filter(Boolean).join("<br>");
          const m = L.marker([marker.lat, marker.lng], { icon }).addTo(map).bindPopup(popup);
          m.on("click", () => {
            window.location.href = `/schedule`;
          });
        });
        if (markers.length > 1) {
          map.fitBounds(markers.map((marker) => [marker.lat, marker.lng]), { padding: [40, 40] });
        }
        mapInstance.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      })
      .catch(() => {
        if (!cancelled) setMapError("Map could not start. Refresh the page.");
      });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, markers]);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-border bg-card">
      <div ref={mapRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card text-sm text-muted-foreground">Finding the job address…</div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-card px-6 text-center text-sm text-muted-foreground">{mapError}</div>
      )}
      {(unresolved.length > 0) && (
        <div className="absolute left-3 top-3 z-[500] max-w-sm rounded-md bg-black/75 px-3 py-2 text-[11px] text-white/90 backdrop-blur-sm">
          Could not locate: {unresolved.join("; ")}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
        Job sites
      </div>
    </div>
  );
}
