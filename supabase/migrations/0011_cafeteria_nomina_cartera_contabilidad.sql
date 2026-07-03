-- ============================================================
-- MÓDULO: Cafetería
-- ============================================================

create table cafeteria_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table cafeteria_productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references cafeteria_categorias(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null default 0,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cafeteria_ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  cliente_nombre text,
  total numeric(10,2) not null default 0,
  observacion text,
  registrado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table cafeteria_venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references cafeteria_ventas(id) on delete cascade,
  producto_id uuid references cafeteria_productos(id) on delete set null,
  nombre_producto text not null,
  cantidad integer not null default 1,
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create table cafeteria_gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  concepto text not null,
  monto numeric(10,2) not null,
  observacion text,
  registrado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MÓDULO: Nómina
-- ============================================================

create table nomina_cargos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  salario_base numeric(14,2) not null default 0
);

create table nomina_empleados (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  cargo_id uuid references nomina_cargos(id) on delete set null,
  nombres text not null,
  apellidos text not null,
  documento text,
  fecha_ingreso date,
  tipo_contrato text not null default 'indefinido',
  salario numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table nomina_periodos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'abierto',
  created_at timestamptz not null default now()
);

create table nomina_liquidaciones (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid not null references nomina_periodos(id) on delete cascade,
  empleado_id uuid not null references nomina_empleados(id) on delete cascade,
  salario_base numeric(14,2) not null,
  bonificaciones numeric(14,2) not null default 0,
  deducciones numeric(14,2) not null default 0,
  neto numeric(14,2) not null,
  observacion text,
  created_at timestamptz not null default now(),
  unique(periodo_id, empleado_id)
);

create table nomina_novedades (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references nomina_empleados(id) on delete cascade,
  tipo text not null,  -- licencia | incapacidad | vacaciones | permiso | sancion
  fecha_inicio date not null,
  fecha_fin date,
  dias integer,
  descripcion text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MÓDULO: Cartera (cuentas por cobrar)
-- ============================================================

create table cartera_clientes (
  id uuid primary key default gen_random_uuid(),
  nombres text not null,
  apellidos text not null,
  documento text,
  telefono text,
  email text,
  direccion text,
  tipo text not null default 'padre_familia',  -- padre_familia | empresa | otro
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table cartera_facturas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cartera_clientes(id) on delete restrict,
  numero text,
  concepto text not null,
  fecha_emision date not null default current_date,
  fecha_vencimiento date,
  valor_total numeric(14,2) not null,
  saldo numeric(14,2) not null,
  estado text not null default 'pendiente',  -- pendiente | parcial | pagada | vencida | anulada
  observacion text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table cartera_pagos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references cartera_facturas(id) on delete restrict,
  fecha date not null default current_date,
  monto numeric(14,2) not null,
  forma_pago text not null default 'efectivo',  -- efectivo | transferencia | cheque | otro
  referencia text,
  registrado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MÓDULO: Contabilidad
-- ============================================================

create table contabilidad_periodos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'abierto',  -- abierto | cerrado
  created_at timestamptz not null default now()
);

create table contabilidad_cuentas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  tipo text not null,  -- ingreso | egreso | activo | pasivo | patrimonio
  descripcion text,
  is_active boolean not null default true
);

create table contabilidad_ingresos (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid references contabilidad_periodos(id) on delete set null,
  cuenta_id uuid references contabilidad_cuentas(id) on delete set null,
  fecha date not null default current_date,
  concepto text not null,
  valor numeric(14,2) not null,
  comprobante text,
  observacion text,
  registrado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table contabilidad_egresos (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid references contabilidad_periodos(id) on delete set null,
  cuenta_id uuid references contabilidad_cuentas(id) on delete set null,
  fecha date not null default current_date,
  concepto text not null,
  valor numeric(14,2) not null,
  comprobante text,
  observacion text,
  registrado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS: todas las tablas nuevas solo accesibles para staff/admin
-- ============================================================

alter table cafeteria_categorias enable row level security;
alter table cafeteria_productos enable row level security;
alter table cafeteria_ventas enable row level security;
alter table cafeteria_venta_items enable row level security;
alter table cafeteria_gastos enable row level security;
alter table nomina_cargos enable row level security;
alter table nomina_empleados enable row level security;
alter table nomina_periodos enable row level security;
alter table nomina_liquidaciones enable row level security;
alter table nomina_novedades enable row level security;
alter table cartera_clientes enable row level security;
alter table cartera_facturas enable row level security;
alter table cartera_pagos enable row level security;
alter table contabilidad_periodos enable row level security;
alter table contabilidad_cuentas enable row level security;
alter table contabilidad_ingresos enable row level security;
alter table contabilidad_egresos enable row level security;

-- Cafetería: staff gestiona, autenticados ven productos
create policy "cafe_cat_staff" on cafeteria_categorias for all using (is_staff());
create policy "cafe_cat_read" on cafeteria_categorias for select using (auth.uid() is not null);
create policy "cafe_prod_staff" on cafeteria_productos for all using (is_staff());
create policy "cafe_prod_read" on cafeteria_productos for select using (auth.uid() is not null);
create policy "cafe_venta_staff" on cafeteria_ventas for all using (is_staff());
create policy "cafe_item_staff" on cafeteria_venta_items for all using (is_staff());
create policy "cafe_gasto_staff" on cafeteria_gastos for all using (is_staff());

-- Nómina: solo rector y administrador
create policy "nomina_cargos_admin" on nomina_cargos for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "nomina_emp_admin" on nomina_empleados for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "nomina_per_admin" on nomina_periodos for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "nomina_liq_admin" on nomina_liquidaciones for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "nomina_nov_admin" on nomina_novedades for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));

-- Cartera: staff
create policy "cartera_cli_staff" on cartera_clientes for all using (is_staff());
create policy "cartera_fac_staff" on cartera_facturas for all using (is_staff());
create policy "cartera_pago_staff" on cartera_pagos for all using (is_staff());

-- Contabilidad: rector y administrador
create policy "conta_per_admin" on contabilidad_periodos for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "conta_cta_admin" on contabilidad_cuentas for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "conta_ing_admin" on contabilidad_ingresos for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));
create policy "conta_egr_admin" on contabilidad_egresos for all
  using (auth.uid() in (select id from profiles where role in ('rector','administrador') and is_active));

notify pgrst, 'reload schema';
