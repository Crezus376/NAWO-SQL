-- Data API grants (missing entirely -> PostgREST 403)
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

GRANT SELECT ON public.ticket_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
GRANT ALL ON public.ticket_types TO service_role;

GRANT SELECT ON public.event_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_pages TO authenticated;
GRANT ALL ON public.event_pages TO service_role;

GRANT SELECT ON public.ticket_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_templates TO authenticated;
GRANT ALL ON public.ticket_templates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambassadors TO authenticated;
GRANT ALL ON public.ambassadors TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hosts TO authenticated;
GRANT ALL ON public.hosts TO service_role;

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

GRANT SELECT ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

GRANT SELECT ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- RLS policies call has_role(); without EXECUTE the policy errors out.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;