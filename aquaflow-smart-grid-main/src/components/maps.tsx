import { lazy } from "react";
import { ClientOnly } from "./ClientOnly";

const MapPickerInner = lazy(() => import("./MapPicker").then((m) => ({ default: m.MapPicker })));
const TrackingMapInner = lazy(() => import("./TrackingMap").then((m) => ({ default: m.TrackingMap })));
const HeatmapViewInner = lazy(() => import("./HeatmapView").then((m) => ({ default: m.HeatmapView })));
const RouteMapInner = lazy(() => import("./RouteMap").then((m) => ({ default: m.RouteMap })));

const Skeleton = ({ height = 320 }: { height?: number }) => (
  <div style={{ height }} className="rounded-lg border bg-muted animate-pulse" />
);

type MapPickerProps = { value: { lat: number; lng: number } | null; onChange: (v: { lat: number; lng: number }) => void; height?: number };
export const MapPicker = (p: MapPickerProps) => (
  <ClientOnly fallback={<Skeleton height={p.height ?? 320} />}><MapPickerInner {...p} /></ClientOnly>
);

type TrackingProps = { destination: { lat: number; lng: number }; origin?: { lat: number; lng: number }; height?: number };
export const TrackingMap = (p: TrackingProps) => (
  <ClientOnly fallback={<Skeleton height={p.height ?? 320} />}><TrackingMapInner {...p} /></ClientOnly>
);

type HeatProps = { points: Array<{ id: string; name: string; lat: number; lng: number; intensity: number; demand: "low" | "moderate" | "high" }>; height?: number };
export const HeatmapView = (p: HeatProps) => (
  <ClientOnly fallback={<Skeleton height={p.height ?? 480} />}><HeatmapViewInner {...p} /></ClientOnly>
);

type RouteProps = { destination: { lat: number; lng: number }; height?: number };
export const RouteMap = (p: RouteProps) => (
  <ClientOnly fallback={<Skeleton height={p.height ?? 360} />}><RouteMapInner {...p} /></ClientOnly>
);
