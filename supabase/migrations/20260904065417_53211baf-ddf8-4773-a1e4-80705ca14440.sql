REVOKE ALL ON FUNCTION public.create_main_session() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_custom_page_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.organizer_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.organizer_balance(uuid) TO authenticated, service_role;