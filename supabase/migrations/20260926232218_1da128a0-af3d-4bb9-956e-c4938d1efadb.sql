CREATE OR REPLACE FUNCTION public.check_access()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _p record; _s record;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('allowed', false, 'reason', 'not_authenticated'); END IF;
  IF public.has_role_slug(_uid, 'super-admin') THEN RETURN jsonb_build_object('allowed', true); END IF;
  SELECT company_id, status INTO _p FROM public.profiles WHERE id = _uid;
  IF _p.status IS DISTINCT FROM 'active' THEN RETURN jsonb_build_object('allowed', false, 'reason', 'account_disabled'); END IF;
  IF _p.company_id IS NULL THEN RETURN jsonb_build_object('allowed', false, 'reason', 'no_company'); END IF;
  SELECT status, end_date INTO _s FROM public.subscriptions WHERE company_id = _p.company_id ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed', false, 'reason', 'no_subscription'); END IF;
  IF _s.end_date < CURRENT_DATE OR _s.status = 'EXPIRED' THEN RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_expired', 'end_date', _s.end_date); END IF;
  IF _s.status <> 'ACTIVE' THEN RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_' || lower(_s.status)); END IF;
  RETURN jsonb_build_object('allowed', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.check_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_access() TO authenticated;