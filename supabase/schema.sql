-- Loja SR Calçados — rode no SQL Editor do Supabase (ou via CLI)
-- Extensões
create extension if not exists "uuid-ossp";

-- Perfis (admin vs cliente)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Produtos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  discount_percent numeric(5,2) default 6,
  max_installments integer default 5,
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  audience text check (audience in ('feminino', 'infantil')),
  style text check (style in ('casual', 'esportivo', 'promocao')),
  category text check (category in ('sandalia','tenis','sapato','bota','rasteirinha','chinelo','mule','sapatilha','tamanco','melissa')),
  available_sizes int[],
  available_colors text[],
  extra_image_urls text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migração segura para bancos já existentes
alter table public.products add column if not exists code text;
alter table public.products add column if not exists discount_percent numeric(5,2) default 6;
alter table public.products add column if not exists max_installments integer default 5;
alter table public.products add column if not exists audience text;
alter table public.products add column if not exists style text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists available_sizes int[];
alter table public.products add column if not exists available_colors text[];
alter table public.products add column if not exists extra_image_urls text[];

do $$
begin
  alter table public.products
    add constraint products_audience_check
    check (audience in ('feminino', 'infantil'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.products
    add constraint products_style_check
    check (style in ('casual', 'esportivo', 'promocao'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.products
    add constraint products_category_check
    check (category in ('sandalia','tenis','sapato','bota','rasteirinha','chinelo','mule','sapatilha','tamanco','melissa'));
exception when duplicate_object then null;
end $$;

create index if not exists products_active_idx on public.products (active);
create index if not exists products_slug_idx on public.products (slug);

alter table public.products enable row level security;

drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_admin_all" on public.products;

create policy "products_public_read_active"
  on public.products for select
  using (active = true);

create policy "products_admin_all"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Pedidos (escrita apenas via service role nas rotas API)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'failed')),
  total_cents integer not null check (total_cents >= 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb,
  mercadopago_preference_id text,
  mercadopago_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

drop policy if exists "orders_admin_read" on public.orders;

create policy "orders_admin_read"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Pedidos vindos do checkout via WhatsApp (histórico no admin)
create table if not exists public.whatsapp_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  total_cents integer not null check (total_cents >= 0),
  whatsapp_message text not null,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_orders enable row level security;

drop policy if exists "whatsapp_orders_admin_read" on public.whatsapp_orders;
drop policy if exists "whatsapp_orders_admin_write" on public.whatsapp_orders;

create policy "whatsapp_orders_admin_read"
  on public.whatsapp_orders for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "whatsapp_orders_admin_write"
  on public.whatsapp_orders for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_admin_read" on public.order_items;

create policy "order_items_admin_read"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Trigger: criar profile ao registrar usuário
-- Cadastro pela app em /admin/cadastro envia raw_user_meta_data.app_signup = 'admin_panel' → role admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  r text;
begin
  if coalesce(new.raw_user_meta_data->>'app_signup', '') = 'admin_panel' then
    r := 'admin';
  else
    r := 'customer';
  end if;
  insert into public.profiles (id, role, preferences)
  values (new.id, r, '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atualizar updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated on public.products;
create trigger products_updated
  before update on public.products
  for each row execute procedure public.set_updated_at();

drop trigger if exists orders_updated on public.orders;
create trigger orders_updated
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- Storage: imagens de produtos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "product_images_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "product_images_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Cadastro em /admin/cadastro já grava app_signup = admin_panel e este trigger define role admin.
-- Contas antigas (customer) podem ser promovidas: update public.profiles set role = 'admin' where id = '...';
