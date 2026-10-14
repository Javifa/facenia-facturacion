-- ==============================================================================
-- FACENIA FACTURACIÓN - ESQUEMA INICIAL DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Cumple con directrices de seguridad RLS de la skill supabase-security
-- ==============================================================================

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
