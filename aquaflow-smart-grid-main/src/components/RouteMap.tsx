import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { L, BENGALURU, stationIcon } from "@/lib/leaflet-setup";
import "leaflet-routing-machine";

const STATION: [number, number] = [BENGALURU[0] + 0.02, BENGALURU[1] - 0.02];

function Routing({ destination }: { destination: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Lany = L as any;
    const control = Lany.Routing.control({
      waypoints: [L.latLng(STATION[0], STATION[1]), L.latLng(destination.lat, destination.lng)],
      lineOptions: { styles: [{ color: "hsl(210 70% 50%)", weight: 5 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: (i: number, wp: { latLng: L.LatLng }) =>
        i === 0
          ? L.marker(wp.latLng, { icon: stationIcon })
          : L.marker(wp.latLng),
    }).addTo(map);
    return () => {
      map.removeControl(control);
    };
  }, [map, destination.lat, destination.lng]);
  return null;
}

export function RouteMap({ destination, height = 360 }: { destination: { lat: number; lng: number }; height?: number }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border">
      <MapContainer center={BENGALURU} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Routing destination={destination} />
      </MapContainer>
    </div>
  );
}
