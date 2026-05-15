import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { BENGALURU } from "@/lib/leaflet-setup";

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}

function ClickHandler({ onChange }: { onChange: (v: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapPicker({ value, onChange, height = 320 }: Props) {
  // Default-pin Bengaluru if nothing yet
  useEffect(() => {
    if (!value) onChange({ lat: BENGALURU[0], lng: BENGALURU[1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border">
      <MapContainer center={BENGALURU} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}
