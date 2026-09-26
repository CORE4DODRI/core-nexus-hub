-- ============ CORE TABLES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  status text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  group_name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT 'Box',
  version text NOT NULL DEFAULT '1.0.0',
  route text,
  status text NOT NULL DEFAULT 'inactive',
  enabled boolean NOT NULL DEFAULT false,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, code)
);

CREATE TABLE public.module_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  target_module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  connection_type text NOT NULL DEFAULT 'module_to_core',
  status text NOT NULL DEFAULT 'active',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  description text,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  group_name text NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_connections TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.profiles, public.roles, public.permissions, public.user_roles,
  public.role_permissions, public.modules, public.module_permissions,
  public.module_connections, public.activity_logs, public.system_settings TO service_role;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.code = _code
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role_slug(_user_id uuid, _slug text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND r.slug = _slug
  );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_roles_updated BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_modules_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_connections_updated BEFORE UPDATE ON public.module_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_settings_updated BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bootstrap: create profile for current user, assign Super Admin to the very first user
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_first_name text DEFAULT NULL, _last_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _role_id uuid;
  _is_first boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT email, raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name'
    INTO _email, _first_name, _last_name
  FROM auth.users WHERE id = _uid;

  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (_uid, _email, _first_name, _last_name)
  ON CONFLICT (id) DO UPDATE SET last_login_at = now(), email = EXCLUDED.email;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO _is_first;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid) THEN
    SELECT id INTO _role_id FROM public.roles WHERE slug = CASE WHEN _is_first THEN 'super-admin' ELSE 'viewer' END;
    IF _role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id) VALUES (_uid, _role_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  UPDATE public.profiles SET last_login_at = now() WHERE id = _uid;

  INSERT INTO public.activity_logs (user_id, actor_label, action, entity_type, description, status)
  VALUES (_uid, _email, 'user.login', 'auth', 'User signed in', 'success');
END; $$;

GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text, text) TO authenticated;

-- ============ RLS ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self_or_perm" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_permission(auth.uid(), 'users.view'));
CREATE POLICY "profiles_update_self_or_perm" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_permission(auth.uid(), 'users.edit'))
  WITH CHECK (id = auth.uid() OR public.has_permission(auth.uid(), 'users.edit'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_permission(auth.uid(), 'users.create'));

CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_write" ON public.roles FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'roles.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));

CREATE POLICY "permissions_select" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_write" ON public.permissions FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'permissions.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'permissions.manage'));

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'users.view'));
CREATE POLICY "user_roles_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'users.edit'))
  WITH CHECK (public.has_permission(auth.uid(), 'users.edit'));

CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_write" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'roles.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));

CREATE POLICY "modules_select" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "modules_insert" ON public.modules FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'modules.install'));
CREATE POLICY "modules_update" ON public.modules FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'modules.configure'))
  WITH CHECK (public.has_permission(auth.uid(), 'modules.configure'));
CREATE POLICY "modules_delete" ON public.modules FOR DELETE TO authenticated
  USING (public.has_permission(auth.uid(), 'modules.install'));

CREATE POLICY "module_permissions_select" ON public.module_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "module_permissions_write" ON public.module_permissions FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'modules.configure'))
  WITH CHECK (public.has_permission(auth.uid(), 'modules.configure'));

CREATE POLICY "connections_select" ON public.module_connections FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'connections.view'));
CREATE POLICY "connections_insert" ON public.module_connections FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'connections.create'));
CREATE POLICY "connections_update" ON public.module_connections FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'connections.edit'))
  WITH CHECK (public.has_permission(auth.uid(), 'connections.edit'));
CREATE POLICY "connections_delete" ON public.module_connections FOR DELETE TO authenticated
  USING (public.has_permission(auth.uid(), 'connections.delete'));

CREATE POLICY "logs_select" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'logs.view') OR user_id = auth.uid());
CREATE POLICY "logs_insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings_select" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'settings.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'settings.manage'));

-- ============ SEED ============
INSERT INTO public.roles (name, slug, description, is_system) VALUES
  ('Super Admin', 'super-admin', 'Full unrestricted access to the platform Core', true),
  ('Administrator', 'administrator', 'Manages users, modules and connections', true),
  ('Manager', 'manager', 'Operational management access', true),
  ('Editor', 'editor', 'Can edit content and configuration', true),
  ('Viewer', 'viewer', 'Read-only access', true);

INSERT INTO public.permissions (code, group_name, description) VALUES
  ('core.view', 'CORE', 'View the Core dashboard'),
  ('core.manage', 'CORE', 'Manage Core configuration'),
  ('users.view', 'USERS', 'View users'),
  ('users.create', 'USERS', 'Create users'),
  ('users.edit', 'USERS', 'Edit users'),
  ('users.disable', 'USERS', 'Disable users'),
  ('roles.view', 'ROLES', 'View roles'),
  ('roles.manage', 'ROLES', 'Create and edit roles'),
  ('permissions.view', 'PERMISSIONS', 'View permissions'),
  ('permissions.manage', 'PERMISSIONS', 'Manage permissions'),
  ('modules.view', 'MODULES', 'View modules'),
  ('modules.install', 'MODULES', 'Register and remove modules'),
  ('modules.activate', 'MODULES', 'Activate modules'),
  ('modules.disable', 'MODULES', 'Disable modules'),
  ('modules.configure', 'MODULES', 'Configure modules'),
  ('connections.view', 'CONNECTIONS', 'View module connections'),
  ('connections.create', 'CONNECTIONS', 'Create module connections'),
  ('connections.edit', 'CONNECTIONS', 'Edit module connections'),
  ('connections.delete', 'CONNECTIONS', 'Delete module connections'),
  ('logs.view', 'LOGS', 'View activity logs'),
  ('settings.view', 'SETTINGS', 'View system settings'),
  ('settings.manage', 'SETTINGS', 'Manage system settings');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p WHERE r.slug = 'super-admin';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.slug = 'administrator' AND p.code NOT IN ('permissions.manage');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.slug = 'manager' AND p.code IN ('core.view','users.view','roles.view','permissions.view','modules.view','modules.activate','modules.disable','connections.view','logs.view','settings.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.slug = 'editor' AND p.code IN ('core.view','users.view','modules.view','connections.view','settings.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.slug = 'viewer' AND p.code IN ('core.view','modules.view');

INSERT INTO public.modules (name, slug, description, icon, version, route, status, enabled) VALUES
  ('CMS', 'cms', 'Content management module', 'FileText', '1.0.0', '/modules/cms', 'active', true),
  ('Catalog', 'catalog', 'Product catalog module', 'Package', '1.0.0', '/modules/catalog', 'active', true);

INSERT INTO public.module_connections (source_module_id, target_module_id, connection_type, status, permissions)
SELECT m.id, NULL, 'module_to_core', 'active', '["core.read"]'::jsonb FROM public.modules m WHERE m.slug IN ('cms','catalog');

INSERT INTO public.system_settings (key, value, group_name, description) VALUES
  ('platform_name', '"DODRI PLATFORM CORE"'::jsonb, 'general', 'Platform display name'),
  ('platform_timezone', '"UTC"'::jsonb, 'general', 'Default timezone'),
  ('maintenance_mode', 'false'::jsonb, 'system', 'Put the platform in maintenance mode'),
  ('api_enabled', 'true'::jsonb, 'api', 'Enable the platform API layer');