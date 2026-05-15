import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Droplets,
  ArrowLeft,
  MapPin,
  User as UserIcon,
  Truck,
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  Phone,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

interface Ward {
  id: string;
  name: string;
  demand_level: "low" | "moderate" | "high";
  tanker_count: number;
}

const demandStyle: Record<Ward["demand_level"], { dot: string; label: string }> = {
  high: { dot: "bg-destructive", label: "High demand" },
  moderate: { dot: "bg-warning", label: "Moderate demand" },
  low: { dot: "bg-success", label: "Low demand" },
};

const roleOptions = [
  {
    value: "user" as const,
    label: "Resident",
    desc: "Order water tankers",
    Icon: UserIcon,
  },
  {
    value: "driver" as const,
    label: "Tanker Driver",
    desc: "Fulfill deliveries",
    Icon: Truck,
  },
  {
    value: "municipal" as const,
    label: "Municipal Admin",
    desc: "Oversee the city",
    Icon: ShieldCheck,
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(true);
  const [wardsError, setWardsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // signin
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [wardId, setWardId] = useState<string>("");
  const [role, setRole] = useState<"user" | "driver" | "municipal">("user");

  const loadWards = async () => {
    setWardsLoading(true);
    setWardsError(null);
    const { data, error } = await supabase
      .from("wards")
      .select("id,name,demand_level,tanker_count")
      .order("name");
    if (error) {
      setWardsError(error.message);
    } else if (data) {
      setWards(data as Ward[]);
      if (data[0] && !wardId) setWardId(data[0].id);
    }
    setWardsLoading(false);
  };

  useEffect(() => {
    loadWards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authLoading && session) navigate({ to: "/dashboard" });
  }, [authLoading, session, navigate]);

  const selectedWard = useMemo(
    () => wards.find((w) => w.id === wardId) ?? null,
    [wards, wardId],
  );

  const drops = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 6,
        size: 6 + Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [],
  );

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signinEmail,
      password: signinPassword,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      toast.error("Please fill all fields");
      return;
    }
    if (!wardId) {
      toast.error("Please select your ward");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name, phone, ward_id: wardId, role },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Account created! Signing you in…");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated water backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="water-gradient absolute inset-0 opacity-[0.08]" />
        {drops.map((d) => (
          <span
            key={d.id}
            className="animate-drop absolute top-0 rounded-full bg-[var(--water-mid)]"
            style={{
              left: `${d.left}%`,
              width: d.size,
              height: d.size * 1.4,
              opacity: d.opacity,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
        {/* Soft ripples */}
        <div className="absolute left-[12%] top-[28%] h-40 w-40 rounded-full border-2 border-[var(--water-mid)]/30 animate-ripple" />
        <div
          className="absolute right-[8%] bottom-[18%] h-56 w-56 rounded-full border-2 border-[var(--water-light)]/40 animate-ripple"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 md:py-12">
        <div className="grid w-full gap-10 md:grid-cols-[1.05fr_1fr] md:items-center">
          {/* Left: Brand panel */}
          <div className="hidden md:block">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 -z-10 animate-ripple rounded-full bg-[var(--water-mid)]/30" />
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--water-deep)] to-[var(--water-mid)] shadow-lg">
                  <Droplets className="h-7 w-7 text-white animate-float" />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Smart Urban Water
                </p>
                <h2 className="text-2xl font-bold tracking-tight">Jala-Mitra</h2>
              </div>
            </div>

            <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Every drop,{" "}
              <span className="shimmer-text">fairly delivered.</span>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Join Bengaluru's intelligent water network — order tankers, track them
              live, and let FairWater AI keep the city flowing equitably.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { Icon: Droplets, label: "FairWater AI" },
                { Icon: Truck, label: "Live tracking" },
                { Icon: ShieldCheck, label: "Anti-hoarding" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="glass-card rounded-xl p-3 text-center transition-transform hover:-translate-y-0.5"
                >
                  <Icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth card */}
          <div className="relative">
            <Link
              to="/"
              className="mb-4 flex items-center justify-center gap-2 md:hidden"
            >
              <Droplets className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">Jala-Mitra</span>
            </Link>

            <div className="glass-card relative overflow-hidden rounded-3xl p-6 md:p-8">
              {/* Decorative wave */}
              <svg
                className="pointer-events-none absolute -bottom-1 left-0 right-0 w-full opacity-40"
                viewBox="0 0 600 60"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  className="animate-wave"
                  d="M0,30 C120,60 240,0 360,30 C480,60 600,10 600,30 L600,60 L0,60 Z"
                  fill="var(--water-mid)"
                  opacity="0.35"
                />
                <path
                  className="animate-wave"
                  style={{ animationDelay: "1.4s" }}
                  d="M0,40 C150,10 300,55 450,30 C525,18 600,40 600,40 L600,60 L0,60 Z"
                  fill="var(--water-light)"
                  opacity="0.5"
                />
              </svg>

              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "signin" | "signup")}
              >
                <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/60 p-1">
                  <TabsTrigger
                    value="signin"
                    className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow"
                  >
                    Create account
                  </TabsTrigger>
                </TabsList>

                {/* Sign in */}
                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignin} className="space-y-4">
                    <FieldWithIcon Icon={Mail} label="Email">
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(e.target.value)}
                        className="pl-10"
                      />
                    </FieldWithIcon>
                    <FieldWithIcon Icon={Lock} label="Password">
                      <Input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        className="pl-10"
                      />
                    </FieldWithIcon>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full bg-gradient-to-r from-[var(--water-deep)] to-[var(--water-mid)] shadow-md transition-transform hover:-translate-y-0.5"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      New here?{" "}
                      <button
                        type="button"
                        onClick={() => setTab("signup")}
                        className="font-medium text-primary hover:underline"
                      >
                        Create an account
                      </button>
                    </p>
                  </form>
                </TabsContent>

                {/* Sign up */}
                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Role selector — large interactive cards */}
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        I am a
                      </Label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {roleOptions.map(({ value, label, desc, Icon }) => {
                          const active = role === value;
                          return (
                            <button
                              type="button"
                              key={value}
                              onClick={() => setRole(value)}
                              className={[
                                "group rounded-2xl border p-3 text-left transition-all",
                                active
                                  ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
                                  : "border-border bg-card/60 hover:border-primary/40 hover:bg-card",
                              ].join(" ")}
                            >
                              <Icon
                                className={[
                                  "h-5 w-5 transition-transform",
                                  active
                                    ? "text-primary scale-110"
                                    : "text-muted-foreground group-hover:text-foreground",
                                ].join(" ")}
                              />
                              <p className="mt-2 text-sm font-semibold">{label}</p>
                              <p className="text-[10px] leading-tight text-muted-foreground">
                                {desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FieldWithIcon Icon={UserIcon} label="Full name">
                        <Input
                          required
                          placeholder="Asha Kumar"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                        />
                      </FieldWithIcon>
                      <FieldWithIcon Icon={Phone} label="Phone">
                        <Input
                          required
                          inputMode="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                        />
                      </FieldWithIcon>
                    </div>

                    <FieldWithIcon Icon={Mail} label="Email">
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </FieldWithIcon>

                    <FieldWithIcon Icon={Lock} label="Password">
                      <Input
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </FieldWithIcon>

                    {/* Ward selector */}
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Your ward
                      </Label>
                      <div className="relative mt-2">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-primary" />
                        <Select
                          value={wardId}
                          onValueChange={setWardId}
                          disabled={wardsLoading || wards.length === 0}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-input pl-10 pr-3">
                            {wardsLoading ? (
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading wards…
                              </span>
                            ) : wards.length === 0 ? (
                              <span className="text-destructive">
                                No wards available
                              </span>
                            ) : selectedWard ? (
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="font-medium">
                                  {selectedWard.name}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span
                                    className={`h-2 w-2 rounded-full ${demandStyle[selectedWard.demand_level].dot}`}
                                  />
                                  {demandStyle[selectedWard.demand_level].label}
                                </span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select your ward" />
                            )}
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {wards.map((w) => (
                              <SelectItem key={w.id} value={w.id} className="py-2.5">
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span className="font-medium">{w.name}</span>
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span
                                      className={`h-2 w-2 rounded-full ${demandStyle[w.demand_level].dot}`}
                                    />
                                    {w.tanker_count} tankers
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {wardsError && (
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          <span>Couldn't load wards: {wardsError}</span>
                          <button
                            type="button"
                            className="font-semibold underline"
                            onClick={loadWards}
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading || wardsLoading || !wardId}
                      className="w-full rounded-full bg-gradient-to-r from-[var(--water-deep)] to-[var(--water-mid)] shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create my account
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      Already part of Jala-Mitra?{" "}
                      <button
                        type="button"
                        onClick={() => setTab("signin")}
                        className="font-medium text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldWithIcon({
  Icon,
  label,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
