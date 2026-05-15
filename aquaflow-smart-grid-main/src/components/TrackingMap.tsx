import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { BENGALURU, tankerIcon, stationIcon } from "@/lib/leaflet-setup";

interface Props {
  destination: { lat: number; lng: number };
  origin?: { lat: number; lng: number };
  height?: number;
}

// Bengaluru "filling station" reference
const STATION: [number, number] = [BENGALURU[0] + 0.02, BENGALURU[1] - 0.02];

export function TrackingMap({ destination, origin, height = 320 }: Props) {
  const start = origin ?? { lat: STATION[0], lng: STATION[1] };
  const [t, setT] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setT((x) => (x + 0.01) % 1.001), 200);
    return () => clearInterval(id);
  }, []);

  const lat = start.lat + (destination.lat - start.lat) * t;
  const lng = start.lng + (destination.lng - start.lng) * t;

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border">
      <MapContainer
        center={[(start.lat + destination.lat) / 2, (start.lng + destination.lng) / 2]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[start.lat, start.lng]} icon={stationIcon} />
        <Marker position={[destination.lat, destination.lng]} />
        <Marker position={[lat, lng]} icon={tankerIcon} />
        <Polyline
          positions={[[start.lat, start.lng], [destination.lat, destination.lng]]}
          pathOptions={{ color: "hsl(210 70% 50%)", dashArray: "6 8", weight: 3 }}
        />
      </MapContainer>
    </div>
  );
}
