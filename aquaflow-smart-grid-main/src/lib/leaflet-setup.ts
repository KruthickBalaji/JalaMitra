import L from "leaflet";

// Fix default marker icon paths (Vite doesn't bundle them automatically)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const BENGALURU: [number, number] = [12.9716, 77.5946];
export { L };

// Cute tanker icon (emoji-based divIcon — no external assets)
export const tankerIcon = L.divIcon({
  className: "tanker-marker",
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">🚛</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const stationIcon = L.divIcon({
  className: "station-marker",
  html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">🏭</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
