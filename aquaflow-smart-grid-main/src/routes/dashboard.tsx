import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Droplets, LogOut } from "lucide-react";
import { UserPortal } from "@/portals/UserPortal";
import { DriverPortal } from "@/portals/DriverPortal";
import { MunicipalPortal } from "@/portals/MunicipalPortal";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { session, loading, role, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold leading-tight">Jala-Mitra</p>
              <p className="text-xs leading-tight text-muted-foreground capitalize">
                {role ?? "..."} portal{profile?.name ? ` · ${profile.name}` : ""}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {role === "driver" ? <DriverPortal />
          : role === "municipal" ? <MunicipalPortal />
          : <UserPortal />}
      </main>
    </div>
  );
}
