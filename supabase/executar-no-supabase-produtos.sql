-- =============================================================================
-- Loja SR Calçados — atualizar tabela public.products (Supabase → SQL Editor)
--
-- Quando aparecer erro do tipo «coluna ... não existe» ou «schema cache» ao
-- listar/gravar produtos, execute ESTE ficheiro completo.
--
-- Como usar: SQL Editor → "+ New query" → colar este ficheiro inteiro → Run.
-- É seguro repetir: todas as colunas usam IF NOT EXISTS.
-- =============================================================================

alter table public.products add column if not exists code text;
alter table public.products add column if not exists discount_percent numeric(5,2) default 6;
alter table public.products add column if not exists max_installments integer default 5;
alter table public.products add column if not exists audience text;
alter table public.products add column if not exists style text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists available_sizes int[];
alter table public.products add column if not exists available_colors text[];
alter table public.products add column if not exists promo_coupon_code text;
alter table public.products add column if not exists promo_coupon_percent numeric(5,2);
alter table public.products add column if not exists extra_image_urls text[];
alter table public.products add column if not exists color_linked_images jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists brand text;

-- Fim. Deve aparecer "Success" (ou várias linhas "ALTER TABLE").
