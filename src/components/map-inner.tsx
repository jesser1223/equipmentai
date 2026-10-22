// @ts-nocheck
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapView = MapContainer as any;
const MapTiles = TileLayer as any;
const MapMarker = Marker as any;
const MapPopup = Popup as any;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitToJobs({ locations }: { locations: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (!locations.length) return;
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, locations]);
  return null;
}

export default function MapInner({
  locations,
}: {
  locations: { lat: number; lng: number; label: string; address?: string; customer?: string; status?: string }[];
}) {
  const first = locations[0];
  return (
    <MapView center={first ? [first.lat, first.lng] : [49.2827, -123.1207]} zoom={first ? 12 : 11} style={{ height: "100%", width: "100%" }}>
      <MapTiles
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToJobs locations={locations} />
      {locations.map((loc, i) => (
        <MapMarker key={i} position={[loc.lat, loc.lng]}>
          <MapPopup>
            <div>
              <strong>{loc.label}</strong>
              {loc.customer && <div>{loc.customer}</div>}
              {loc.address && <div>{loc.address}</div>}
              {loc.status && <div>{loc.status}</div>}
            </div>
          </MapPopup>
        </MapMarker>
      ))}
    </MapView>
  );
}
