
REVOKE EXECUTE ON FUNCTION public.attach_profile_company() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backfill_profiles_company() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.subscription_log_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.subscription_set_end_date() FROM PUBLIC, anon, authenticated;
