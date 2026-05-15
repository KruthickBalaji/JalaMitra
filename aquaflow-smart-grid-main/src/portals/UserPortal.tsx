import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPicker, TrackingMap } from "@/components/maps";
import { toast } from "sonner";
import { Droplet, MapPin, Clock, Truck, AlertTriangle, History } from "lucide-react";

interface Order {
  id: string;
  capacity: number;
  status: string;
  lat: number;
  lng: number;
  driver_id: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  address_note: string | null;
}

const COOLDOWN_DAYS: Record<number, number> = { 5000: 3, 10000: 4, 15000: 5 };
const CAPACITIES = [5000, 10000, 15000];

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (s === "completed") return "secondary";
  if (s === "cancelled" || s === "rejected") return "destructive";
  return "default";
}

export function UserPortal() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState<number>(5000);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [driverNames, setDriverNames] = useState<Record<string, { name: string; phone: string }>>({});
  const [leakOpen, setLeakOpen] = useState(false);
  const [leakOrderId, setLeakOrderId] = useState<string | "">("");
  const [leakDesc, setLeakDesc] = useState("");

  // tick for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    // fetch driver names
    const driverIds = Array.from(new Set((data ?? []).map((o) => o.driver_id).filter(Boolean))) as string[];
    if (driverIds.length) {
      const { data: drivers } = await supabase.from("profiles").select("id,name,phone").in("id", driverIds);
      const map: Record<string, { name: string; phone: string }> = {};
      (drivers ?? []).forEach((d) => { map[d.id] = { name: d.name, phone: d.phone }; });
      setDriverNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, [user]); // eslint-disable-line

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("user-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]); // eslint-disable-line

  // Cooldown calc
  const cooldown = useMemo(() => {
    const days = COOLDOWN_DAYS[capacity] ?? 3;
    const last = orders.find((o) => o.status === "completed" && o.capacity === capacity);
    if (!last?.completed_at) return null;
    const ends = new Date(last.completed_at).getTime() + days * 86400000;
    if (ends <= now) return null;
    return { ends, msLeft: ends - now };
  }, [orders, capacity, now]);

  const fmtCountdown = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  const submitOrder = async () => {
    if (!user || !pin) { toast.error("Please pin your address on the map"); return; }
    if (cooldown) { toast.error("Cooldown active for this capacity"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      ward_id: profile?.ward_id ?? null,
      capacity,
      lat: pin.lat,
      lng: pin.lng,
      address_note: note || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Order placed!"); setNote(""); loadOrders(); }
  };

  const cancelOrder = async (id: string, createdAt: string) => {
    const within5min = Date.now() - new Date(createdAt).getTime() <= 5 * 60 * 1000;
    if (!within5min) { toast.error("Cancel window expired (5 min)"); return; }
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Cancelled"); loadOrders(); }
  };

  const submitLeak = async () => {
    if (!user || !leakDesc) return;
    const { error } = await supabase.from("leak_reports").insert({
      user_id: user.id,
      order_id: leakOrderId || null,
      description: leakDesc,
    });
    if (error) toast.error(error.message);
    else { toast.success("Report sent to Municipal team"); setLeakOpen(false); setLeakDesc(""); setLeakOrderId(""); }
  };

  const activeOrder = orders.find((o) => ["pending", "accepted", "in_transit"].includes(o.status));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Order form */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Droplet className="h-5 w-5 text-primary" /> Order a tanker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-2 block">Capacity</Label>
              <RadioGroup value={String(capacity)} onValueChange={(v) => setCapacity(Number(v))} className="grid grid-cols-3 gap-3">
                {CAPACITIES.map((c) => (
                  <label key={c} className={`cursor-pointer rounded-lg border p-3 text-center transition ${capacity === c ? "border-primary bg-accent/40" : "hover:bg-muted/40"}`}>
                    <RadioGroupItem value={String(c)} className="sr-only" />
                    <div className="text-lg font-bold">{(c / 1000)}k L</div>
                    <div className="text-xs text-muted-foreground">{COOLDOWN_DAYS[c]}-day cooldown</div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Pin exact address</Label>
              <MapPicker value={pin} onChange={setPin} height={300} />
              {pin && <p className="mt-1 text-xs text-muted-foreground">Pinned: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</p>}
            </div>

            <div>
              <Label className="mb-2 block">Address note (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Apartment, gate, landmark…" maxLength={300} />
            </div>

            {cooldown && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                <Clock className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">FairWater AI cooldown active</p>
                  <p className="text-muted-foreground">You can next order this capacity in <span className="font-mono font-semibold">{fmtCountdown(cooldown.msLeft)}</span></p>
                </div>
              </div>
            )}

            <Button size="lg" className="w-full" disabled={!!cooldown || submitting || !pin} onClick={submitOrder}>
              {submitting ? "Placing…" : cooldown ? "Cooldown active" : "Place order"}
            </Button>
          </CardContent>
        </Card>

        {activeOrder && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Live tracking</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={statusVariant(activeOrder.status)} className="capitalize">{activeOrder.status.replace("_", " ")}</Badge>
                <span className="text-muted-foreground">·</span>
                <span>{activeOrder.capacity / 1000}k L</span>
                {activeOrder.driver_id && driverNames[activeOrder.driver_id] && (
                  <>
                    <span className="text-muted-foreground">· Driver:</span>
                    <span className="font-medium">{driverNames[activeOrder.driver_id].name}</span>
                    <span className="text-muted-foreground">({driverNames[activeOrder.driver_id].phone})</span>
                  </>
                )}
              </div>
              <TrackingMap destination={{ lat: activeOrder.lat, lng: activeOrder.lng }} height={280} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar: history + report */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Order history</CardTitle>
            <Dialog open={leakOpen} onOpenChange={setLeakOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><AlertTriangle className="mr-1 h-3.5 w-3.5" /> Report</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Report leak / quantity issue</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Related order (optional)</Label>
                    <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={leakOrderId} onChange={(e) => setLeakOrderId(e.target.value)}>
                      <option value="">— None —</option>
                      {orders.filter((o) => o.status === "completed").map((o) => (
                        <option key={o.id} value={o.id}>{o.capacity / 1000}k L · {new Date(o.created_at).toLocaleDateString()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={leakDesc} onChange={(e) => setLeakDesc(e.target.value)} placeholder="Describe the leak or under-delivery…" maxLength={500} />
                  </div>
                  <Button onClick={submitLeak} className="w-full">Send to Municipal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <Tabs defaultValue="active">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-3 space-y-2">
                  {orders.filter((o) => ["pending", "accepted", "in_transit"].includes(o.status)).map((o) => (
                    <OrderRow key={o.id} order={o} now={now} onCancel={() => cancelOrder(o.id, o.created_at)} />
                  ))}
                  {orders.filter((o) => ["pending", "accepted", "in_transit"].includes(o.status)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No active orders.</p>
                  )}
                </TabsContent>
                <TabsContent value="past" className="mt-3 space-y-2">
                  {orders.filter((o) => !["pending", "accepted", "in_transit"].includes(o.status)).map((o) => (
                    <OrderRow key={o.id} order={o} now={now} />
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrderRow({ order, now, onCancel }: { order: Order; now: number; onCancel?: () => void }) {
  const ageMs = now - new Date(order.created_at).getTime();
  const canCancel = order.status === "pending" && ageMs <= 5 * 60 * 1000;
  const cancelMsLeft = Math.max(0, 5 * 60 * 1000 - ageMs);
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{order.capacity / 1000}k L tanker</p>
          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <Badge variant={statusVariant(order.status)} className="capitalize">{order.status.replace("_", " ")}</Badge>
      </div>
      {canCancel && onCancel && (
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={onCancel}>
          Cancel ({Math.ceil(cancelMsLeft / 1000)}s left)
        </Button>
      )}
    </div>
  );
}
