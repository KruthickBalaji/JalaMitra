import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, CircleMarker, Tooltip } from "react-leaflet";
import { L, BENGALURU } from "@/lib/leaflet-setup";
import "leaflet.heat";

interface WardPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number; // 0..1
  demand: "low" | "moderate" | "high";
}

function HeatLayer({ points }: { points: WardPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const data = points.map((p) => [p.lat, p.lng, p.intensity] as [number, number, number]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layer = (L as any).heatLayer(data, {
      radius: 45,
      blur: 30,
      maxZoom: 15,
      gradient: { 0.2: "#22c55e", 0.5: "#eab308", 0.8: "#ef4444" },
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);
  return null;
}

const COLOR: Record<WardPoint["demand"], string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#ef4444",
};

export function HeatmapView({ points, height = 480 }: { points: WardPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border">
      <MapContainer center={BENGALURU} zoom={11} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={8}
            pathOptions={{ color: COLOR[p.demand], fillColor: COLOR[p.demand], fillOpacity: 0.85, weight: 2 }}
          >
            <Tooltip direction="top">{p.name} — {p.demand}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
