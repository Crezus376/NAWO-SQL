-- anon: read-only, and only on genuinely public tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.events, public.ticket_types, public.event_pages, public.ticket_templates TO anon;

-- authenticated: writes only where an INSERT/UPDATE/DELETE policy exists
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.events, public.ticket_types, public.event_pages, public.ticket_templates,
  public.promo_codes, public.ambassadors, public.hosts
TO authenticated;
GRANT SELECT ON public.orders, public.payments, public.tickets, public.scans, public.user_roles TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;