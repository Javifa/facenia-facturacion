-- ==============================================================================
-- FACENIA FACTURACIÓN - ESQUEMA INICIAL DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Cumple con directrices de seguridad RLS de la skill supabase-security
-- ==============================================================================

-- 0. EXTENSIONES Y TABLA: USUARIOS (Con contraseñas hasheadas bcrypt y sincronizada con auth.users)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'administrador' CHECK (rol IN ('admin_supremo', 'administrador', 'lectura')),
  activo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acceso TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1. TABLA: EMPRESA_CONFIG
CREATE TABLE IF NOT EXISTS public.empresa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_comercial TEXT NOT NULL DEFAULT 'FACENIA',
  razon_social TEXT NOT NULL,
  nif_cif TEXT NOT NULL,
  direccion TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'España',
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  logotipo_url TEXT,
  datos_bancarios JSONB DEFAULT '{"iban": "", "bic": "", "banco": "", "titular": ""}'::jsonb,
  forma_pago_predeterminada TEXT DEFAULT 'Transferencia bancaria a 30 días',
  pie_factura_predeterminado TEXT,
  registro_mercantil TEXT,
  es_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_o_razon_social TEXT NOT NULL,
  nif_cif TEXT NOT NULL,
  direccion_fiscal TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'España',
  email TEXT,
  telefono TEXT,
  notas_internas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA: FACTURAS
CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT 'FAC-2026',
  numero_secuencial INTEGER NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_operacion DATE,
  fecha_vencimiento DATE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  
  -- Snapshot inmutable de datos al momento de emisión (garantiza no alteración histórica)
  cliente_snapshot JSONB NOT NULL,
  emisor_snapshot JSONB NOT NULL,
  
  moneda TEXT NOT NULL DEFAULT 'EUR',
  forma_pago TEXT NOT NULL,
  datos_bancarios JSONB,
  observaciones TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('borrador', 'emitida', 'pendiente_cobro', 'parcialmente_cobrada', 'cobrada', 'vencida', 'rectificada', 'anulada')),
  
  -- Campos rectificativa
  es_rectificativa BOOLEAN NOT NULL DEFAULT false,
  factura_rectificada_numero TEXT,
  factura_rectificada_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  motivo_rectificacion TEXT,

  -- Desglose y totales
  subtotal_bruto NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  descuento_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  base_imponible_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  desglose_iva JSONB NOT NULL DEFAULT '[]'::jsonb,
  cuota_iva_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  retencion_irpf_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  importe_retencion_irpf NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_final NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  
  -- Cobros
  importe_cobrado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  importe_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0.00,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT unique_numero_serie UNIQUE (user_id, serie, numero)
);

-- 4. TABLA: FACTURA_LINEAS
CREATE TABLE IF NOT EXISTS public.factura_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  tipo_iva NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  base_imponible NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  cuota_iva NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_linea NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  orden INTEGER NOT NULL DEFAULT 1
);

-- 5. TABLA: PAGOS_FACTURA
CREATE TABLE IF NOT EXISTS public.pagos_factura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  importe NUMERIC(12,2) NOT NULL,
  metodo TEXT NOT NULL,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO (OBLIGATORIOS PARA RLS SEGÚN SUPABASE-SECURITY)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_empresa_config_user_id ON public.empresa_config(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_facturas_user_id ON public.facturas(user_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON public.facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON public.facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_factura_lineas_factura_id ON public.factura_lineas(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura_factura_id ON public.pagos_factura(factura_id);

-- ==============================================================================
-- ACTIVACIÓN Y POLÍTICAS ROW LEVEL SECURITY (RLS) GRANULARES POR OPERACIÓN
-- ==============================================================================

-- 1. EMPRESA_CONFIG
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen su configuracion"
  ON public.empresa_config FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios insertan su configuracion"
  ON public.empresa_config FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios actualizan su configuracion"
  ON public.empresa_config FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. CLIENTES
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen sus clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios crean sus clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios actualizan sus clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios eliminan sus clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 3. FACTURAS
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen sus facturas"
  ON public.facturas FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios crean sus facturas"
  ON public.facturas FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios actualizan sus facturas"
  ON public.facturas FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Usuarios eliminan sus facturas borrador"
  ON public.facturas FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND estado = 'borrador');

-- 4. FACTURA_LINEAS
ALTER TABLE public.factura_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen las lineas de sus facturas"
  ON public.factura_lineas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facturas f
      WHERE f.id = factura_lineas.factura_id
      AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Usuarios insertan lineas en sus facturas"
  ON public.factura_lineas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.facturas f
      WHERE f.id = factura_lineas.factura_id
      AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Usuarios modifican lineas de sus facturas"
  ON public.factura_lineas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facturas f
      WHERE f.id = factura_lineas.factura_id
      AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Usuarios eliminan lineas de sus facturas"
  ON public.factura_lineas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facturas f
      WHERE f.id = factura_lineas.factura_id
      AND f.user_id = (SELECT auth.uid())
    )
  );

-- 5. PAGOS_FACTURA
ALTER TABLE public.pagos_factura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen pagos de sus facturas"
  ON public.pagos_factura FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facturas f
      WHERE f.id = pagos_factura.factura_id
      AND f.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Usuarios registran pagos en sus facturas"
  ON public.pagos_factura FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.facturas f
      WHERE f.id = pagos_factura.factura_id
      AND f.user_id = (SELECT auth.uid())
    )
  );

-- ==============================================================================
-- FUNCIONES AUXILIARES, SINCRONIZACIÓN DE USUARIOS Y ADMIN SUPREMO
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_supremo()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin_supremo'
    OR (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin_supremo'
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin_supremo' AND u.activo = true
    ),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_supremo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_supremo() TO authenticated;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen su propio perfil o admin supremo"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin_supremo());

CREATE POLICY "Usuarios insertan su propio perfil o admin supremo"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id OR public.is_admin_supremo());

CREATE POLICY "Usuarios actualizan su propio perfil o admin supremo"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin_supremo())
  WITH CHECK ((SELECT auth.uid()) = id OR public.is_admin_supremo());

CREATE POLICY "Admin supremo elimina usuarios"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (public.is_admin_supremo());

CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol TEXT;
  v_nombre TEXT;
  v_username TEXT;
BEGIN
  v_rol := COALESCE(
    NEW.raw_app_meta_data ->> 'rol',
    NEW.raw_user_meta_data ->> 'rol',
    CASE WHEN NEW.email = 'admin@gmail.com' THEN 'admin_supremo' ELSE 'administrador' END
  );
  IF v_rol NOT IN ('admin_supremo', 'administrador', 'lectura') THEN
    v_rol := 'administrador';
  END IF;

  v_nombre := COALESCE(
    NEW.raw_user_meta_data ->> 'nombre',
    CASE WHEN NEW.email = 'admin@gmail.com' THEN 'Admin Supremo' ELSE split_part(NEW.email, '@', 1) END
  );

  v_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    CASE WHEN NEW.email = 'admin@gmail.com' THEN 'admin123' ELSE split_part(NEW.email, '@', 1) END
  );

  INSERT INTO public.usuarios (id, email, username, nombre, rol, activo, ultimo_acceso, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_username,
    v_nombre,
    v_rol,
    true,
    COALESCE(NEW.last_sign_in_at, now()),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(EXCLUDED.nombre, public.usuarios.nombre),
    rol = EXCLUDED.rol,
    ultimo_acceso = COALESCE(NEW.last_sign_in_at, public.usuarios.ultimo_acceso),
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_auth_user_sync() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();

CREATE OR REPLACE FUNCTION public.login_usuario(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash TEXT;
  v_clean TEXT;
BEGIN
  v_clean := lower(trim(p_username));

  SELECT u.password_hash INTO v_hash
  FROM public.usuarios u
  WHERE (lower(u.username) = v_clean OR lower(u.email) = v_clean)
    AND u.activo = true
  LIMIT 1;

  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN false;
  END IF;

  RETURN (v_hash = extensions.crypt(p_password, v_hash));
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_usuario(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolver_email_login(p_identificador TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_clean TEXT;
BEGIN
  v_clean := lower(trim(p_identificador));

  SELECT u.email INTO v_email
  FROM public.usuarios u
  WHERE (lower(u.username) = v_clean OR lower(u.email) = v_clean)
    AND u.activo = true
  LIMIT 1;

  RETURN COALESCE(v_email, v_clean);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolver_email_login(TEXT) TO anon, authenticated;

