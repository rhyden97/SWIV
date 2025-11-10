-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.areas_almacen (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  descripcion text,
  criterios_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  frecuencia_dias integer DEFAULT 7,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT areas_almacen_pkey PRIMARY KEY (id)
);
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido_1 text,
  apellido_2 text,
  telefono text,
  email text NOT NULL,
  direccion text,
  activo boolean DEFAULT true,
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  mes_referencia date NOT NULL,
  fecha_calculo timestamp with time zone DEFAULT now(),
  valor numeric,
  recalculo_gemini numeric,
  mensaje text,
  CONSTRAINT kpis_pkey PRIMARY KEY (id)
);
CREATE TABLE public.proveedores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  contacto character varying,
  telefono character varying,
  email character varying,
  direccion text,
  fecha_creacion timestamp with time zone DEFAULT now(),
  tiempo_entrega_min integer,
  tiempo_entrega_max integer,
  costo_pedido numeric DEFAULT '0'::numeric,
  activo boolean DEFAULT true,
  CONSTRAINT proveedores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.productos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  sku text UNIQUE,
  stock_actual integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 0,
  precio_venta numeric NOT NULL,
  proveedor_id uuid,
  clasificacion_abc USER-DEFINED DEFAULT 'C'::clasificacion_abc_tipo,
  eoq integer DEFAULT 0,
  punto_reorden integer DEFAULT 0,
  stock_seguridad integer DEFAULT 0,
  ubicacion text,
  ubicacion_objetivo text DEFAULT 'Zona C'::text,
  estado_ciclo_vida text DEFAULT 'Activo'::text,
  politica_inventario text DEFAULT 'C'::text,
  costo_unitario_base numeric,
  origen text DEFAULT ''::text,
  activo boolean DEFAULT true,
  unidad_medida text,
  es_perecedero boolean DEFAULT false,
  dias_alerta_vencimiento integer DEFAULT 15,
  CONSTRAINT productos_pkey PRIMARY KEY (id),
  CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id)
);
CREATE TABLE public.ventas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  fecha_venta timestamp with time zone NOT NULL DEFAULT now(),
  total_venta numeric NOT NULL,
  metodo_pago character varying,
  url_recibo text,
  CONSTRAINT ventas_pkey PRIMARY KEY (id),
  CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.reportes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo_reporte USER-DEFINED NOT NULL,
  fecha_generacion timestamp with time zone NOT NULL DEFAULT now(),
  parametros jsonb,
  url_archivo text,
  generado_por_id uuid,
  CONSTRAINT reportes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ordenes_compra (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proveedor_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  fecha_pedido date NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_estimada date,
  estado USER-DEFINED NOT NULL DEFAULT 'borrador'::estado_orden_compra,
  total_orden numeric,
  calificacion smallint,
  notas text,
  fecha_entrega_real date,
  url_comprobante text,
  CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id)
);
CREATE TABLE public.ordenes_despacho (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_entrega date,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente'::estado_orden_despacho,
  venta_id uuid,
  CONSTRAINT ordenes_despacho_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_despacho_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id)
);
CREATE TABLE public.registros_limpieza (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL,
  usuario_id uuid,
  resultados_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  observaciones text,
  estado public.estado_tareas DEFAULT 'asignado'::public.estado_tareas,
  url_evidencia text,
  fecha_registro timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT registros_limpieza_pkey PRIMARY KEY (id),
  CONSTRAINT registros_limpieza_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas_almacen(id)
);
CREATE TABLE public.predicciones_ventas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid,
  fecha_generacion timestamp with time zone NOT NULL DEFAULT now(),
  periodo_inicio date NOT NULL,
  periodo_fin date NOT NULL,
  prediccion_lstm numeric,
  ajuste_gemini numeric NOT NULL,
  explicacion character varying,
  metadata jsonb,
  confianza numeric,
  explicacion_gemini text,
  CONSTRAINT predicciones_ventas_pkey PRIMARY KEY (id),
  CONSTRAINT predicciones_ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.reporte_diario_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_reporte date DEFAULT CURRENT_DATE,
  producto_id uuid,
  nombre_producto text,
  stock_al_corte integer,
  nivel_alerta text,
  mensaje text,
  CONSTRAINT reporte_diario_stock_pkey PRIMARY KEY (id),
  CONSTRAINT reporte_diario_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.tareas_conteo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  usuario_asignado_id uuid,
  stock_logico_snapshot integer NOT NULL,
  conteo_fisico integer,
  diferencia integer,
  justificacion text,
  estado character varying DEFAULT 'Pendiente'::character varying CHECK (estado::text = ANY (ARRAY['Pendiente'::character varying::text, 'Completada'::character varying::text, 'Ajustada'::character varying::text])),
  fecha_asignacion timestamp with time zone NOT NULL DEFAULT now(),
  fecha_completado timestamp with time zone,
  CONSTRAINT tareas_conteo_pkey PRIMARY KEY (id),
  CONSTRAINT tareas_conteo_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.venta_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT venta_items_pkey PRIMARY KEY (id),
  CONSTRAINT venta_items_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT venta_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.orden_compra_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  orden_compra_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL,
  costo_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  fecha_vencimiento date,
  CONSTRAINT orden_compra_items_pkey PRIMARY KEY (id),
  CONSTRAINT orden_compra_items_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id),
  CONSTRAINT orden_compra_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.movimientos_inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  orden_despacho_id uuid,
  orden_compra_id uuid,
  tipo_movimiento USER-DEFINED NOT NULL,
  cantidad integer NOT NULL,
  fecha_movimiento timestamp with time zone DEFAULT now(),
  CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id),
  CONSTRAINT movimientos_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT movimientos_inventario_orden_produccion_id_fkey FOREIGN KEY (orden_despacho_id) REFERENCES public.ordenes_despacho(id),
  CONSTRAINT movimientos_inventario_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL,
  nombre text NOT NULL,
  apellido text,
  rol USER-DEFINED NOT NULL DEFAULT 'almacen'::rol_usuario,
  activo boolean DEFAULT true,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.lotes_producto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  codigo_lote character varying NOT NULL,
  stock_lote integer NOT NULL DEFAULT 0,
  fecha_vencimiento date NOT NULL,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  CONSTRAINT lotes_producto_pkey PRIMARY KEY (id),
  CONSTRAINT lotes_producto_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);