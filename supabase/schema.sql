-- Esquema relacional para RuedaLibre en Supabase (PostgreSQL)
-- Ejecuta este archivo en el SQL Editor de tu proyecto Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tienda', 'taller', 'estacion')),
  address text not null,
  phone text not null,
  email text not null,
  hours text not null,
  latitude double precision not null,
  longitude double precision not null,
  description text not null default '',
  available boolean not null default true,
  bike_types_supported text[] not null default '{}',
  services_summary text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  item_type text not null check (item_type in ('bicicleta', 'accesorio')),
  name text not null,
  brand text not null,
  bike_type text not null,
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  available boolean not null default true,
  specs text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.repairs (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  service_name text not null,
  service_category text not null,
  bike_type text not null,
  price numeric(10, 2) not null check (price >= 0),
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  available boolean not null default true,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_locations_category on public.locations(category);
create index if not exists idx_products_location on public.products(location_id);
create index if not exists idx_products_item_type on public.products(item_type);
create index if not exists idx_products_bike_type on public.products(bike_type);
create index if not exists idx_repairs_location on public.repairs(location_id);
create index if not exists idx_repairs_category on public.repairs(service_category);

alter table public.locations enable row level security;
alter table public.products enable row level security;
alter table public.repairs enable row level security;

-- Lectura pública para el catálogo y mapa; el backend usa SUPABASE_SERVICE_ROLE_KEY para escrituras seguras.
create policy "Lectura publica de locales" on public.locations for select using (true);
create policy "Lectura publica de productos" on public.products for select using (true);
create policy "Lectura publica de reparaciones" on public.repairs for select using (true);
