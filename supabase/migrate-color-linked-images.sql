-- Migração única: fotos ligadas a cores (admin / API).
-- Supabase → SQL Editor → colar → Run.
-- Seguro repetir: usa IF NOT EXISTS.

alter table public.products
  add column if not exists color_linked_images jsonb not null default '[]'::jsonb;
