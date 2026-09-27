ALTER TABLE public.profiles ADD COLUMN access_type text NOT NULL DEFAULT 'interne';
ALTER TABLE public.modules ADD COLUMN parent_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;

CREATE TABLE public.user_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_module_access TO authenticated;
GRANT ALL ON public.user_module_access TO service_role;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY uma_select ON public.user_module_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'users.view'));
CREATE POLICY uma_write ON public.user_module_access FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'users.edit'))
  WITH CHECK (public.has_permission(auth.uid(), 'users.edit'));

CREATE OR REPLACE FUNCTION public.can_see_module(_uid uuid, _module_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role_slug(_uid, 'super-admin')
    OR COALESCE((SELECT access_type FROM public.profiles WHERE id = _uid), 'interne') = 'super_admin'
    OR EXISTS (SELECT 1 FROM public.user_module_access WHERE user_id = _uid AND module_id = _module_id)
    OR EXISTS (SELECT 1 FROM public.modules c JOIN public.user_module_access a ON a.module_id = c.id
               WHERE c.parent_id = _module_id AND a.user_id = _uid);
$$;
REVOKE EXECUTE ON FUNCTION public.can_see_module(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_see_module(uuid, uuid) TO authenticated;

DROP POLICY modules_select ON public.modules;
CREATE POLICY modules_select ON public.modules FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'modules.configure') OR public.can_see_module(auth.uid(), id));

INSERT INTO public.modules (name, slug, description, icon, route, status, enabled)
VALUES ('SaaS', 'saas', 'Container for SaaS modules offered to external users', 'Cloud', '/modules/saas', 'active', true)
ON CONFLICT DO NOTHING;

UPDATE public.profiles p SET access_type = 'super_admin'
WHERE EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id = ur.role_id WHERE ur.user_id = p.id AND r.slug = 'super-admin');