
-- 1. COMPANY (singleton)
CREATE TABLE public.company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX company_singleton_idx ON public.company ((true));
GRANT SELECT, INSERT, UPDATE ON public.company TO authenticated;
GRANT ALL ON public.company TO service_role;
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_select ON public.company FOR SELECT TO authenticated USING (true);
CREATE POLICY company_insert ON public.company FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'company.manage'));
CREATE POLICY company_update ON public.company FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'company.manage')) WITH CHECK (has_permission(auth.uid(), 'company.manage'));
CREATE TRIGGER company_updated_at BEFORE UPDATE ON public.company FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. USERS -> COMPANY
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.attach_profile_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT id INTO NEW.company_id FROM public.company LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_attach_company BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.attach_profile_company();

-- backfill when a company gets created later
CREATE OR REPLACE FUNCTION public.backfill_profiles_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET company_id = NEW.id WHERE company_id IS NULL;
  RETURN NEW;
END;
$$;
CREATE TRIGGER company_backfill_profiles AFTER INSERT ON public.company FOR EACH ROW EXECUTE FUNCTION public.backfill_profiles_company();

-- 3. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('MONTHLY','SEMI_ANNUAL','ANNUAL')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','SUSPENDED','CANCELLED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX subscriptions_one_active_idx ON public.subscriptions (company_id) WHERE status = 'ACTIVE';
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_select ON public.subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY subscriptions_insert ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'subscription.manage'));
CREATE POLICY subscriptions_update ON public.subscriptions FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'subscription.manage')) WITH CHECK (has_permission(auth.uid(), 'subscription.manage'));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto end_date from plan
CREATE OR REPLACE FUNCTION public.subscription_set_end_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.end_date := NEW.start_date + CASE NEW.plan
    WHEN 'MONTHLY' THEN interval '1 month'
    WHEN 'SEMI_ANNUAL' THEN interval '6 months'
    ELSE interval '12 months'
  END;
  RETURN NEW;
END;
$$;
CREATE TRIGGER subscriptions_end_date BEFORE INSERT OR UPDATE OF plan, start_date ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.subscription_set_end_date();

-- 4. SUBSCRIPTION HISTORY
CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event text NOT NULL,
  from_plan text,
  to_plan text,
  from_status text,
  to_status text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_events_select ON public.subscription_events FOR SELECT TO authenticated USING (true);
CREATE POLICY subscription_events_insert ON public.subscription_events FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), 'subscription.manage'));

CREATE OR REPLACE FUNCTION public.subscription_log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.subscription_events (subscription_id, event, to_plan, to_status, actor_id)
    VALUES (NEW.id, 'Subscription Created', NEW.plan, NEW.status, auth.uid());
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    INSERT INTO public.subscription_events (subscription_id, event, from_plan, to_plan, actor_id)
    VALUES (NEW.id, 'Plan Changed', OLD.plan, NEW.plan, auth.uid());
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    ev := CASE NEW.status
      WHEN 'SUSPENDED' THEN 'Subscription Suspended'
      WHEN 'CANCELLED' THEN 'Subscription Cancelled'
      WHEN 'EXPIRED' THEN 'Subscription Expired'
      WHEN 'ACTIVE' THEN 'Subscription Reactivated'
      ELSE 'Subscription Updated'
    END;
    INSERT INTO public.subscription_events (subscription_id, event, from_status, to_status, actor_id)
    VALUES (NEW.id, ev, OLD.status, NEW.status, auth.uid());
  ELSIF NEW.start_date IS DISTINCT FROM OLD.start_date THEN
    INSERT INTO public.subscription_events (subscription_id, event, to_plan, to_status, actor_id)
    VALUES (NEW.id, 'Subscription Renewed', NEW.plan, NEW.status, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER subscriptions_history AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.subscription_log_event();

-- 5. PERMISSIONS
INSERT INTO public.permissions (code, group_name, description) VALUES
  ('company.view', 'COMPANY', 'View company profile'),
  ('company.manage', 'COMPANY', 'Create or edit the company profile'),
  ('subscription.view', 'SUBSCRIPTION', 'View subscription details'),
  ('subscription.manage', 'SUBSCRIPTION', 'Create, renew or change the subscription')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.slug IN ('super-admin','administrator')
  AND p.code IN ('company.view','company.manage','subscription.view','subscription.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.slug IN ('manager','editor','viewer')
  AND p.code IN ('company.view','subscription.view')
ON CONFLICT DO NOTHING;
