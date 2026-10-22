"use client";

import { useEffect, useRef, useState } from "react";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  address: string;
  matched?: string;
  approximate?: boolean;
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
        const icon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        markers.forEach((marker) => {
          const popup = [
            `<strong>${marker.label}</strong>`,
            marker.customer,
            marker.address,
            marker.matched ? `${marker.approximate ? "Approximate: " : ""}${marker.matched}` : "",
            marker.status,
          ].filter(Boolean).join("<br>");
          L.marker([marker.lat, marker.lng], { icon }).addTo(map).bindPopup(popup);
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

  const approximate = markers.some((marker) => marker.approximate);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-border bg-card">
      <div ref={mapRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card text-sm text-muted-foreground">Finding the job address…</div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-card px-6 text-center text-sm text-muted-foreground">{mapError}</div>
      )}
      {(unresolved.length > 0 || approximate) && (
        <div className="absolute left-3 top-3 z-[500] max-w-sm rounded-md bg-black/75 px-3 py-2 text-[11px] text-white/90 backdrop-blur-sm">
          {unresolved.length > 0 && <div>Could not locate: {unresolved.join("; ")}</div>}
          {approximate && <div>Approximate pin: exact house number is not in the map data.</div>}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-md bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">
        Job sites
      </div>
    </div>
  );
}
