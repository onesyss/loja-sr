-- Marca do produto (filtro na vitrine). Rode no SQL Editor do Supabase se ainda não existir.
alter table public.products add column if not exists brand text;
