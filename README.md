# Loja SR Calçados

Loja virtual com Next.js (App Router), Supabase (Auth, Banco e Storage) e Mercado Pago.

## Stack

- Next.js 16 + React 19
- Supabase (`@supabase/ssr` e `@supabase/supabase-js`)
- Mercado Pago (Checkout + webhook)
- Tailwind CSS

## Como conectar ao Supabase (já tenho conta)

Este passo a passo considera que voce ja possui conta no Supabase e quer conectar este projeto.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
MERCADOPAGO_ACCESS_TOKEN=SEU_TOKEN_MP
```

> Importante: nao commitar `.env.local`.

### 4) Criar estrutura do banco

1. No Supabase, abra **SQL Editor**.
2. Execute o script `supabase/schema.sql`.
3. Confirme se as tabelas foram criadas (`products`, `orders`, `order_items`, `profiles`).

### 5) Criar usuario admin

1. Em **Authentication -> Users**, crie um usuario (email/senha).
2. Copie o `id` (UUID) desse usuario.
3. No SQL Editor, execute:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DO_USUARIO';
```

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

1. Importe o repositorio na Vercel.
2. Configure as mesmas variaveis do `.env.local`.
3. Defina `NEXT_PUBLIC_APP_URL` com a URL publica (ex.: `https://seu-projeto.vercel.app`).

## Solucao de problemas rapida

- **Erro de chave do Supabase:** revise `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Admin sem acesso:** confirme que o usuario esta em `profiles` com `role = 'admin'`.
- **Webhook nao atualiza pedido:** revise `MERCADOPAGO_ACCESS_TOKEN` e URL publica da aplicacao.
