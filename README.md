# Loja SR Calçados

Loja virtual com Next.js (App Router), Supabase (Auth, Banco e Storage) e Mercado Pago.

## Stack

- Next.js 16 + React 19
- Supabase (`@supabase/ssr` e `@supabase/supabase-js`)
- Mercado Pago (Checkout + webhook)
- Tailwind CSS

## Como conectar ao Supabase (já tenho conta)

Guia detalhado (inclui como **verificar tabelas** e testar a API): [`docs/supabase-conexao.md`](docs/supabase-conexao.md).

Este resumo considera que voce ja possui conta no Supabase e quer conectar este projeto.

### 1) Criar ou selecionar projeto

1. Acesse [Supabase](https://supabase.com).
2. Crie um novo projeto (ou use um existente).
3. Aguarde o provisionamento terminar.

### 2) Obter chaves e URL

No painel do projeto, acesse **Project Settings -> API** e copie:

- `Project URL`
- `anon public key`
- `service_role key` (segredo, uso apenas no backend)

### 3) Configurar variaveis locais

Na raiz do projeto:

1. Copie `env.example` para `.env.local`.
2. Preencha as variaveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
MERCADOPAGO_ACCESS_TOKEN=SEU_TOKEN_MP
```

> Importante: nao commitar `.env.local`.

### 4) Criar estrutura do banco

1. No Supabase, abra **SQL Editor**.
2. Execute o script `supabase/schema.sql`.
3. Confirme se as tabelas foram criadas (`profiles`, `products`, `orders`, `order_items`, `whatsapp_orders`). Veja [`docs/supabase-conexao.md`](docs/supabase-conexao.md) para conferência no Table Editor ou via SQL.

### 5) Usuario gestor do painel

1. Abra **/admin/cadastro** na app: o cadastro ja cria perfil com **admin** e `preferences` (preferencias por usuario) se o `schema.sql` estiver atualizado no Supabase.
2. Alternativa manual: crie usuario apenas no **Authentication** e rode SQL para `role = 'admin'` (ver [`docs/supabase-conexao.md`](docs/supabase-conexao.md) secao 7).

Depois use **/admin/login**. Em **/admin/configuracao** cada gestor pode salvar observacoes e opcoes proprias.

### 6) Rodar o projeto

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` para loja e `http://localhost:3000/admin/login` para admin.

## Fluxo de pagamento

1. Checkout cria pedido com status `pending`.
2. Sistema cria preferencia no Mercado Pago.
3. Webhook `POST /api/webhooks/mercadopago` recebe notificacao.
4. Pedido e atualizado para `paid`/`failed` e o estoque e ajustado.

## Deploy na Vercel

O **GitHub só envia o código**. O **banco continua no Supabase**; o deploy **não** copia `.env.local` nem migra dados.

1. Importe o repositorio na Vercel.
2. **Settings → Environment Variables** na Vercel: cadastre **manualmente** as mesmas chaves do `.env.local` (Production e, se quiser, Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` **ou** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (obrigatória para `/api/products` ler/gravar no servidor)
   - `NEXT_PUBLIC_APP_URL` = `https://loja-sr.vercel.app` (ou seu domínio)
   - `MERCADOPAGO_ACCESS_TOKEN` (se usar checkout MP)
3. **Redeploy** depois de salvar as variáveis (Deployments → … → Redeploy), ou faça um commit novo.
4. No Supabase, inclua `https://loja-sr.vercel.app/auth/callback` nas Redirect URLs (ver `docs/supabase-conexao.md`).

Sem `SUPABASE_SERVICE_ROLE_KEY` na Vercel, a API de produtos falha e a loja em produção **não** mostra os itens do Supabase (vitrine vazia ou erro), até você configurar o ambiente.

## Solucao de problemas rapida

- **Erro de chave do Supabase:** revise `NEXT_PUBLIC_SUPABASE_URL` e a chave pública (`NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- **Vercel não mostra os mesmos produtos que no PC:** confira **todas** as variáveis na Vercel (principalmente `SUPABASE_SERVICE_ROLE_KEY`) e redeploy. O Git não envia `.env.local`.
- **Admin sem acesso:** confirme que o usuario esta em `profiles` com `role = 'admin'`.
- **Webhook nao atualiza pedido:** revise `MERCADOPAGO_ACCESS_TOKEN` e URL publica da aplicacao.
