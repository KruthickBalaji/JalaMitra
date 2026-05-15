import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteMap } from "@/components/maps";
import { toast } from "sonner";
import { Truck, Phone, MapPin, Check, X, Ban, Navigation } from "lucide-react";

interface Order {
  id: string; user_id: string; driver_id: string | null;
  capacity: number; status: string; lat: number; lng: number;
  address_note: string | null; created_at: string;
}
interface DriverState { driver_id: string; consecutive_rejections: number; is_blocked: boolean; blocked_until: string | null }
interface UserInfo { id: string; name: string; phone: string }

export function DriverPortal() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Order[]>([]);
  const [mine, setMine] = useState<Order[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [state, setState] = useState<DriverState | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: pend }, { data: m }, { data: ds }] = await Promise.all([
      supabase.from("orders").select("*").is("driver_id", null).eq("status", "pending").order("created_at"),
      supabase.from("orders").select("*").eq("driver_id", user.id).in("status", ["accepted", "in_transit"]).order("created_at"),
      supabase.from("driver_state").select("*").eq("driver_id", user.id).maybeSingle(),
    ]);
    setPending((pend ?? []) as Order[]);
    setMine((m ?? []) as Order[]);
    setState(ds as DriverState | null);

    const ids = Array.from(new Set([...(pend ?? []), ...(m ?? [])].map((o) => o.user_id)));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,name,phone").in("id", ids);
      const map: Record<string, UserInfo> = {};
      (profiles ?? []).forEach((p) => { map[p.id] = p as UserInfo; });
      setUsers(map);
    }
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("driver-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]); // eslint-disable-line

  const blocked = useMemo(() => {
    if (!state?.is_blocked) return false;
    if (state.blocked_until && new Date(state.blocked_until).getTime() < Date.now()) return false;
    return true;
  }, [state]);

  const ensureState = async () => {
    if (!user) return null;
    if (state) return state;
    const { data } = await supabase.from("driver_state").upsert({ driver_id: user.id }).select().maybeSingle();
    setState(data as DriverState);
    return data as DriverState;
  };

  const accept = async (o: Order) => {
    if (blocked) { toast.error("Accept disabled — too many rejections"); return; }
    const { error } = await supabase.from("orders")
      .update({ driver_id: user!.id, status: "in_transit", accepted_at: new Date().toISOString() })
      .eq("id", o.id).is("driver_id", null);
    if (error) { toast.error(error.message); return; }
    // reset rejection counter
    await supabase.from("driver_state").upsert({ driver_id: user!.id, consecutive_rejections: 0, is_blocked: false, blocked_until: null });
    toast.success("Order accepted");
    load();
  };

  const reject = async (o: Order) => {
    const s = await ensureState();
    const newCount = (s?.consecutive_rejections ?? 0) + 1;
    const block = newCount >= 3;
    await supabase.from("driver_state").upsert({
      driver_id: user!.id,
      consecutive_rejections: newCount,
      is_blocked: block,
      blocked_until: block ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null, // 30 min
    });
    // We don't change order status — let it stay pending for another driver
    if (block) toast.error("Accept disabled for 30 minutes (3 consecutive rejections)");
    else toast.message(`Rejected (${newCount}/3 consecutive)`);
    load();
  };

  const complete = async (o: Order) => {
    const { error } = await supabase.from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", o.id);
    if (error) toast.error(error.message);
    else { toast.success("Marked completed — user cooldown started"); load(); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Pending queue
              {blocked && <Badge variant="destructive" className="ml-2"><Ban className="mr-1 h-3 w-3" /> Accept disabled</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending orders.</p>}
            {pending.map((o) => {
              const u = users[o.user_id];
              return (
                <div key={o.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{o.capacity / 1000}k L</p>
                      {u && (
                        <p className="text-sm text-muted-foreground">
                          {u.name} <span className="mx-1">·</span>
                          <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1 underline"><Phone className="h-3 w-3" />{u.phone}</a>
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {o.lat.toFixed(4)}, {o.lng.toFixed(4)}
                        {o.address_note && <> · {o.address_note}</>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="lg" variant="outline" onClick={() => reject(o)}>
                        <X className="mr-1 h-5 w-5" /> Reject
                      </Button>
                      <Button size="lg" disabled={blocked} onClick={() => accept(o)}>
                        <Check className="mr-1 h-5 w-5" /> Accept
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-primary" /> Active deliveries</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {mine.length === 0 && <p className="text-sm text-muted-foreground">None active.</p>}
            {mine.map((o) => {
              const u = users[o.user_id];
              return (
                <div key={o.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{o.capacity / 1000}k L · <Badge className="capitalize">{o.status.replace("_", " ")}</Badge></p>
                      {u && <p className="text-sm text-muted-foreground">{u.name} · {u.phone}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="lg" variant="outline" onClick={() => setSelected(o)}>Show route</Button>
                      <Button size="lg" onClick={() => complete(o)}>Mark completed</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader><CardTitle>Route preview</CardTitle></CardHeader>
          <CardContent>
            {selected ? (
              <RouteMap destination={{ lat: selected.lat, lng: selected.lng }} height={420} />
            ) : (
              <p className="text-sm text-muted-foreground">Select a delivery to view the shortest route from the filling station.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
