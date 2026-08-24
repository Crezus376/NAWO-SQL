-- 1. SESSIONS
CREATE TABLE public.event_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_sessions_event_idx ON public.event_sessions(event_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sessions TO authenticated;
GRANT SELECT ON public.event_sessions TO anon;
GRANT ALL ON public.event_sessions TO service_role;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_sessions_owner_all ON public.event_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_sessions.event_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_sessions.event_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY event_sessions_public_read ON public.event_sessions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_sessions.event_id AND e.status = ANY (ARRAY['published'::event_status,'ongoing'::event_status,'completed'::event_status])));
CREATE TRIGGER event_sessions_updated BEFORE UPDATE ON public.event_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. TICKET TYPE <-> SESSIONS
CREATE TABLE public.ticket_type_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id uuid NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_type_id, session_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_type_sessions TO authenticated;
GRANT SELECT ON public.ticket_type_sessions TO anon;
GRANT ALL ON public.ticket_type_sessions TO service_role;
ALTER TABLE public.ticket_type_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tts_owner_all ON public.ticket_type_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ticket_types tt JOIN public.events e ON e.id = tt.event_id WHERE tt.id = ticket_type_sessions.ticket_type_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ticket_types tt JOIN public.events e ON e.id = tt.event_id WHERE tt.id = ticket_type_sessions.ticket_type_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY tts_public_read ON public.ticket_type_sessions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ticket_types tt JOIN public.events e ON e.id = tt.event_id WHERE tt.id = ticket_type_sessions.ticket_type_id AND e.status = ANY (ARRAY['published'::event_status,'ongoing'::event_status])));

-- 3. TICKET <-> SESSION ACCESS
CREATE TABLE public.ticket_session_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, session_id)
);
GRANT SELECT ON public.ticket_session_access TO authenticated;
GRANT ALL ON public.ticket_session_access TO service_role;
ALTER TABLE public.ticket_session_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY tsa_owner_read ON public.ticket_session_access FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t JOIN public.events e ON e.id = t.event_id WHERE t.id = ticket_session_access.ticket_id AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- 4. SCANS PAR SESSION
ALTER TABLE public.scans ADD COLUMN session_id uuid REFERENCES public.event_sessions(id) ON DELETE SET NULL;

-- 5. CONTENU DES PAGES PERSONNALISEES
ALTER TABLE public.event_pages ADD COLUMN content jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 6. MIGRATION DES DONNEES EXISTANTES
INSERT INTO public.event_sessions (event_id, name, session_date, start_time, sort_order)
SELECT e.id, 'Journée principale', e.event_date, e.event_time, 0
FROM public.events e
WHERE NOT EXISTS (SELECT 1 FROM public.event_sessions s WHERE s.event_id = e.id);

INSERT INTO public.ticket_type_sessions (ticket_type_id, session_id)
SELECT tt.id, s.id
FROM public.ticket_types tt
JOIN public.event_sessions s ON s.event_id = tt.event_id
ON CONFLICT DO NOTHING;

INSERT INTO public.ticket_session_access (ticket_id, session_id, is_used, used_at)
SELECT t.id, s.id, t.is_used, t.used_at
FROM public.tickets t
JOIN public.event_sessions s ON s.event_id = t.event_id
ON CONFLICT DO NOTHING;