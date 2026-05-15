import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Droplets, Truck, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Droplets className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold tracking-tight">Jala-Mitra</span>
        </div>
        <Link to="/auth"><Button variant="outline">Sign in</Button></Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
              Bengaluru — Live
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Smart urban water<br />distribution, simplified.
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Order tankers, track deliveries in real-time, and help prevent water hoarding —
              all powered by FairWater AI cooldowns and live ward demand heatmaps.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg">Get started</Button></Link>
              <Link to="/auth"><Button size="lg" variant="outline">I'm a Driver / Admin</Button></Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg border bg-card p-3">
                <Droplets className="h-5 w-5 text-primary" />
                <p className="mt-2 font-medium">Fair access</p>
                <p className="text-xs text-muted-foreground">Cooldowns prevent hoarding</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <Truck className="h-5 w-5 text-primary" />
                <p className="mt-2 font-medium">Live tracking</p>
                <p className="text-xs text-muted-foreground">See your tanker move</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-2 font-medium">Municipal control</p>
                <p className="text-xs text-muted-foreground">Heatmaps & reallocation</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Demand across Bengaluru
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { name: "Whitefield", level: "high", color: "bg-destructive" },
                  { name: "HSR Layout", level: "high", color: "bg-destructive" },
                  { name: "Indiranagar", level: "moderate", color: "bg-warning" },
                  { name: "Jayanagar", level: "moderate", color: "bg-warning" },
                  { name: "Malleshwaram", level: "low", color: "bg-success" },
                  { name: "Yelahanka", level: "low", color: "bg-success" },
                ].map((w) => (
                  <div key={w.name} className="rounded-lg border p-3">
                    <div className={`h-2 w-8 rounded-full ${w.color}`} />
                    <p className="mt-2 text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{w.level} demand</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © Jala-Mitra · Smart Urban Water Distribution
      </footer>
    </div>
  );
}
