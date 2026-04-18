-- =============================================================================
-- Novos tipos de calçado / Bolsas (substitui a lista antiga).
-- Rode UMA VEZ no Supabase → SQL Editor após atualizar o código da loja.
-- Converte valores antigos da coluna category para os novos códigos.
-- =============================================================================

alter table public.products drop constraint if exists products_category_check;

update public.products
set category = case category
  when 'sandalia' then 'sandalia'
  when 'tenis' then 'tenis'
  when 'rasteirinha' then 'rasteirinha'
  when 'chinelo' then 'chinelo'
  when 'sapato' then 'salto_bloco_fino'
  when 'bota' then 'plataforma'
  when 'mule' then 'papete'
  when 'sapatilha' then 'sandalia'
  when 'tamanco' then 'salto_bloco_grosso'
  when 'melissa' then 'melissa'
  else 'sandalia'
end
where category is not null;

alter table public.products
  add constraint products_category_check
  check (
    category is null
    or category in (
      'salto_bloco_fino',
      'salto_bloco_grosso',
      'anabela',
      'plataforma',
      'papete',
      'sandalia',
      'chinelo',
      'rasteirinha',
      'tenis',
      'melissa',
      'bolsas'
    )
  );
