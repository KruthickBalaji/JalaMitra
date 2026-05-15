import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeatmapView } from "@/components/maps";
import { toast } from "sonner";
import { Activity, Truck, Droplet, AlertTriangle, ArrowRight, Clock } from "lucide-react";

interface Ward { id: string; name: string; tanker_count: number; demand_level: "low" | "moderate" | "high"; center_lat: number; center_lng: number }
interface Order { id: string; ward_id: string | null; status: string; created_at: string; driver_id: string | null }
interface Leak { id: string; description: string; status: string; created_at: string }

export function MunicipalPortal() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const load = async () => {
    const [{ data: w }, { data: o }, { data: l }] = await Promise.all([
      supabase.from("wards").select("*").order("name"),
      supabase.from("orders").select("id,ward_id,status,created_at,driver_id").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from("leak_reports").select("id,description,status,created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    setWards((w ?? []) as Ward[]);
    setOrders((o ?? []) as Order[]);
    setLeaks((l ?? []) as Leak[]);
  };

  useEffect(() => { load(); }, []);

  // Auto-recompute demand based on order count last 7 days
  const wardOrderCounts = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o) => { if (o.ward_id) m[o.ward_id] = (m[o.ward_id] ?? 0) + 1; });
    return m;
  }, [orders]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter((o) => new Date(o.created_at) >= today).length;
  const activeTankers = orders.filter((o) => o.status === "in_transit" && o.driver_id).length;
  const pendingLeaks = leaks.filter((l) => l.status === "pending").length;

  const heatPoints = wards.map((w) => {
    const count = wardOrderCounts[w.id] ?? 0;
    const max = Math.max(1, ...Object.values(wardOrderCounts));
    return {
      id: w.id,
      name: w.name,
      lat: Number(w.center_lat),
      lng: Number(w.center_lng),
      intensity: Math.min(1, 0.2 + 0.8 * (count / max)),
      demand: w.demand_level,
    };
  });

  const reallocate = async () => {
    if (!from || !to || from === to) { toast.error("Select different wards"); return; }
    const src = wards.find((w) => w.id === from);
    const dst = wards.find((w) => w.id === to);
    if (!src || !dst || src.tanker_count <= 0) { toast.error("No tankers in source ward"); return; }
    const { error: e1 } = await supabase.from("wards").update({ tanker_count: src.tanker_count - 1 }).eq("id", src.id);
    const { error: e2 } = await supabase.from("wards").update({ tanker_count: dst.tanker_count + 1 }).eq("id", dst.id);
    if (e1 || e2) toast.error((e1 || e2)!.message); else { toast.success(`Reallocated 1 tanker: ${src.name} → ${dst.name}`); load(); }
  };

  const setDemand = async (wardId: string, level: "low" | "moderate" | "high") => {
    const { error } = await supabase.from("wards").update({ demand_level: level }).eq("id", wardId);
    if (error) toast.error(error.message); else load();
  };

  const updateLeak = async (id: string, status: string) => {
    const { error } = await supabase.from("leak_reports").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  // Borewell smart queue: simulate based on active deliveries
  const slots = useMemo(() => {
    const active = orders.filter((o) => o.status === "in_transit");
    return active.slice(0, 8).map((o, i) => ({
      id: o.id,
      slot: i + 1,
      eta: new Date(Date.now() + (i + 1) * 12 * 60 * 1000),
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Droplet className="h-5 w-5" />} label="Orders today" value={ordersToday} />
        <StatCard icon={<Truck className="h-5 w-5" />} label="Active tankers" value={activeTankers} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Pending leaks" value={pendingLeaks} accent={pendingLeaks > 0 ? "destructive" : undefined} />
      </div>

      <Tabs defaultValue="heatmap">
        <TabsList>
          <TabsTrigger value="heatmap">Demand Heatmap</TabsTrigger>
          <TabsTrigger value="alloc">Dynamic Allocation</TabsTrigger>
          <TabsTrigger value="queue">Borewell Queue</TabsTrigger>
          <TabsTrigger value="leaks">Leak Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Ward demand (last 7 days)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <HeatmapView points={heatPoints} height={460} />
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge className="bg-success text-success-foreground">Low</Badge>
                <Badge className="bg-warning text-warning-foreground">Moderate</Badge>
                <Badge variant="destructive">High</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alloc" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Reassign tankers to high-demand wards</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
                <div>
                  <label className="text-sm font-medium">From (low/green)</label>
                  <Select value={from} onValueChange={setFrom}>
                    <SelectTrigger><SelectValue placeholder="Source ward" /></SelectTrigger>
                    <SelectContent>
                      {wards.filter((w) => w.tanker_count > 0).map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({w.tanker_count} tankers · {w.demand_level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-muted-foreground sm:block" />
                <div>
                  <label className="text-sm font-medium">To (high/red)</label>
                  <Select value={to} onValueChange={setTo}>
                    <SelectTrigger><SelectValue placeholder="Destination ward" /></SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({w.tanker_count} · {w.demand_level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={reallocate}>Reallocate +1</Button>
              </div>

              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr><th className="p-3">Ward</th><th className="p-3">Tankers</th><th className="p-3">Demand</th><th className="p-3">Set demand</th></tr>
                  </thead>
                  <tbody>
                    {wards.map((w) => (
                      <tr key={w.id} className="border-t">
                        <td className="p-3 font-medium">{w.name}</td>
                        <td className="p-3">{w.tanker_count}</td>
                        <td className="p-3 capitalize">
                          <Badge className={
                            w.demand_level === "high" ? "bg-destructive text-destructive-foreground"
                            : w.demand_level === "moderate" ? "bg-warning text-warning-foreground"
                            : "bg-success text-success-foreground"
                          }>{w.demand_level}</Badge>
                        </td>
                        <td className="p-3">
                          <Select value={w.demand_level} onValueChange={(v) => setDemand(w.id, v as "low" | "moderate" | "high")}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Borewell Filling Station — Smart Queue</CardTitle></CardHeader>
            <CardContent>
              {slots.length === 0 ? <p className="text-sm text-muted-foreground">No tankers in queue.</p> : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr><th className="p-3">Slot</th><th className="p-3">Tanker / Order</th><th className="p-3">Reserved time</th><th className="p-3">ETA</th></tr>
                    </thead>
                    <tbody>
                      {slots.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-3 font-bold">#{s.slot}</td>
                          <td className="p-3 font-mono text-xs">{s.id.slice(0, 8)}…</td>
                          <td className="p-3">{s.eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="p-3 text-muted-foreground">in {s.slot * 12} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaks" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /> Recent leak / quantity reports</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaks.length === 0 ? <p className="text-sm text-muted-foreground">No reports.</p> : leaks.map((l) => (
                <div key={l.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{l.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={l.status === "resolved" ? "secondary" : "default"} className="capitalize">{l.status}</Badge>
                    <Select value={l.status} onValueChange={(v) => updateLeak(l.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: "destructive" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-xl p-3 ${accent === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
