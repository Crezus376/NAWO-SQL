-- 1. Journée principale automatique à la création d'un événement
CREATE OR REPLACE FUNCTION public.create_main_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.event_sessions s WHERE s.event_id = NEW.id) THEN
    INSERT INTO public.event_sessions (event_id, name, session_date, start_time, location, sort_order)
    VALUES (NEW.id, 'Journée principale', NEW.event_date, NEW.event_time, NEW.location, 0);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS events_create_main_session ON public.events;
CREATE TRIGGER events_create_main_session
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.create_main_session();

-- Rattrapage : événements existants sans aucune journée
INSERT INTO public.event_sessions (event_id, name, session_date, start_time, location, sort_order)
SELECT e.id, 'Journée principale', e.event_date, e.event_time, e.location, 0
FROM public.events e
WHERE NOT EXISTS (SELECT 1 FROM public.event_sessions s WHERE s.event_id = e.id);

-- 2. Demande de page personnalisée automatique
CREATE OR REPLACE FUNCTION public.sync_custom_page_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.page_mode = 'custom' THEN
    INSERT INTO public.event_pages (event_id, mode, status)
    VALUES (NEW.id, 'custom', 'pending')
    ON CONFLICT (event_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS events_sync_custom_page ON public.events;
CREATE TRIGGER events_sync_custom_page
AFTER INSERT OR UPDATE OF page_mode ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_custom_page_request();

INSERT INTO public.event_pages (event_id, mode, status)
SELECT e.id, 'custom', 'pending' FROM public.events e
WHERE e.page_mode = 'custom'
ON CONFLICT (event_id) DO NOTHING;

-- 3. Retraits
CREATE TYPE public.withdrawal_status AS ENUM ('pending','processing','paid','rejected','cancelled');

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  amount_requested numeric(12,2) NOT NULL CHECK (amount_requested > 0),
  fee_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_debited numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  fee_rate numeric(5,4) NOT NULL DEFAULT 0.10,
  payout_method text NOT NULL,
  payout_details text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  transaction_reference text,
  proof_url text,
  admin_comment text,
  organizer_note text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX withdrawals_organizer_idx ON public.withdrawals (organizer_id, created_at DESC);
CREATE INDEX withdrawals_status_idx ON public.withdrawals (status);

GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawals_owner_read" ON public.withdrawals FOR SELECT TO authenticated
  USING (organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER withdrawals_updated BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Solde d'un organisateur : recettes payées - retraits engagés
CREATE OR REPLACE FUNCTION public.organizer_balance(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT SUM(o.amount) FROM public.orders o
    JOIN public.events e ON e.id = o.event_id
    WHERE e.organizer_id = _user_id AND o.status = 'paid'
  ), 0) - COALESCE((
    SELECT SUM(w.total_debited) FROM public.withdrawals w
    WHERE w.organizer_id = _user_id AND w.status IN ('pending','processing','paid')
  ), 0);
$$;

REVOKE ALL ON FUNCTION public.organizer_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organizer_balance(uuid) TO authenticated, service_role;

-- Rôle administrateur pour le compte prévu
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'crezushoudji@outlook.com'
ON CONFLICT DO NOTHING;