REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role_slug(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_current_user(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text, text) TO authenticated;