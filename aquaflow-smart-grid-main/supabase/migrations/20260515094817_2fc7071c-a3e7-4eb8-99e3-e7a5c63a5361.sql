
CREATE TYPE public.app_role AS ENUM ('user', 'driver', 'municipal');

CREATE TABLE public.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tanker_count int NOT NULL DEFAULT 0,
  demand_level text NOT NULL DEFAULT 'low' CHECK (demand_level IN ('low','moderate','high')),
  center_lat numeric NOT NULL DEFAULT 12.9716,
  center_lng numeric NOT NULL DEFAULT 77.5946,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  ward_id uuid REFERENCES public.wards(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES auth.users(id),
  ward_id uuid REFERENCES public.wards(id),
  capacity int NOT NULL CHECK (capacity IN (5000, 10000, 15000)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_transit','completed','cancelled','rejected')),
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  address_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_driver ON public.orders(driver_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TABLE public.leak_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','investigating','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leak_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.driver_state (
  driver_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consecutive_rejections int NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_until timestamptz
);
ALTER TABLE public.driver_state ENABLE ROW LEVEL SECURITY;

-- Wards policies — publicly readable so the registration dropdown works pre-auth
CREATE POLICY "wards readable to everyone" ON public.wards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wards manageable by municipal" ON public.wards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'municipal'))
  WITH CHECK (public.has_role(auth.uid(), 'municipal'));

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'municipal'));
CREATE POLICY "users insert own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "municipal manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'municipal'))
  WITH CHECK (public.has_role(auth.uid(), 'municipal'));

CREATE POLICY "users view own orders" ON public.orders FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = driver_id
    OR (driver_id IS NULL AND public.has_role(auth.uid(), 'driver'))
    OR public.has_role(auth.uid(), 'municipal')
  );
CREATE POLICY "users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own pending orders" ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending'));
CREATE POLICY "drivers update assigned or claim" ON public.orders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'driver')
    AND (driver_id = auth.uid() OR driver_id IS NULL)
  );
CREATE POLICY "municipal manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'municipal'))
  WITH CHECK (public.has_role(auth.uid(), 'municipal'));

CREATE POLICY "users view own leaks" ON public.leak_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'municipal'));
CREATE POLICY "users create own leaks" ON public.leak_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "municipal update leaks" ON public.leak_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'municipal'));

CREATE POLICY "drivers see own state" ON public.driver_state FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR public.has_role(auth.uid(), 'municipal'));
CREATE POLICY "drivers upsert own state" ON public.driver_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "drivers update own state" ON public.driver_state FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id OR public.has_role(auth.uid(), 'municipal'));

INSERT INTO public.wards (name, tanker_count, demand_level, center_lat, center_lng) VALUES
  ('Whitefield', 8, 'high', 12.9698, 77.7500),
  ('Koramangala', 6, 'high', 12.9352, 77.6245),
  ('Indiranagar', 5, 'moderate', 12.9719, 77.6412),
  ('Jayanagar', 4, 'moderate', 12.9250, 77.5938),
  ('HSR Layout', 6, 'high', 12.9116, 77.6473),
  ('Malleshwaram', 3, 'low', 13.0035, 77.5709),
  ('Yelahanka', 4, 'low', 13.1007, 77.5963),
  ('Electronic City', 7, 'moderate', 12.8452, 77.6602),
  ('Bannerghatta', 3, 'low', 12.8000, 77.5773),
  ('Hebbal', 4, 'moderate', 13.0358, 77.5970);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ward_id uuid;
  _role app_role;
BEGIN
  IF (NEW.raw_user_meta_data->>'ward_id') IS NOT NULL THEN
    _ward_id := (NEW.raw_user_meta_data->>'ward_id')::uuid;
  ELSE
    SELECT id INTO _ward_id FROM public.wards LIMIT 1;
  END IF;

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user');

  INSERT INTO public.profiles (id, name, phone, ward_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    _ward_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  IF _role = 'driver' THEN
    INSERT INTO public.driver_state (driver_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
