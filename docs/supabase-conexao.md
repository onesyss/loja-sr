# Conectar ao Supabase e conferir as tabelas

Guia para ligar este projeto ao seu projeto Supabase, aplicar o schema e **verificar** se tudo foi criado corretamente.

## 1. Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login.
2. **New project** (ou abra um projeto existente).
3. Escolha região, senha do banco e aguarde o status **Active / Healthy**.

## 2. URL e chaves (API)

No painel do projeto:

1. Vá em **Project Settings** (ícone de engrenagem) → **API**.
2. Copie e guarde em local seguro:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL` (ex.: `https://abcdefgh.supabase.co`).
   - Chave pública → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legado) ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nome novo no painel; começa com `sb_publishable_`).
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (**secreto**; só servidor / rotas API — não exponha no navegador).

> As rotas `/api/products` e `/api/whatsapp-orders` usam a **service role** no servidor. Sem ela, você tende a ver erro 500 ou falha ao ler/gravar.

## 3. Variáveis no projeto Next.js

Na **raiz** do repositório:

1. Copie `env.example` para `.env.local` (o arquivo `.env.local` não deve ir para o Git).
2. Preencha no mínimo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
# Defina a chave pública (anon OU publishable — o app aceita os dois nomes)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Salve o arquivo e **reinicie** o servidor (`npm run dev` ou `npm start`) para o Next.js carregar as variáveis.

### Produção na Vercel (domínio deste deploy)

Deploy público: **https://loja-sr.vercel.app**

No painel da **Vercel** → seu projeto → **Settings** → **Environment Variables**, defina pelo menos:

- `NEXT_PUBLIC_APP_URL` = `https://loja-sr.vercel.app` (links de confirmação de e-mail e retornos usam a origem do navegador em runtime; em produção isso alinha callback e integrações)
- As mesmas chaves do Supabase e demais variáveis do `env.example`

No **Supabase** → **Authentication** → **URL Configuration**, inclua nas **Redirect URLs**:

- `https://loja-sr.vercel.app/auth/callback`
- `https://loja-sr.vercel.app/**` (opcional)

## 4. Criar tabelas, políticas e storage

1. No Supabase: **SQL** → **New query**.
2. Abra no seu computador o arquivo `supabase/schema.sql` deste repositório, copie **todo** o conteúdo e cole no editor.
3. Clique em **Run** (ou Ctrl+Enter).

O script é idempotente em boa parte (usa `if not exists`, `add column if not exists`, etc.), então pode ser executado de novo em projetos já parcialmente configurados — revise mensagens de erro se algo conflitar.

## 5. Conferir se as tabelas existem

### Opção A — Table Editor (visual)

1. No menu lateral: **Table Editor**.
2. No seletor de schema, escolha **public**.
3. Você deve ver pelo menos estas tabelas:

| Tabela            | Função resumida                          |
|-------------------|------------------------------------------|
| `profiles`        | Papéis (ex.: admin) ligados ao Auth      |
| `products`        | Catálogo da loja                         |
| `orders`          | Pedidos Mercado Pago                     |
| `order_items`     | Itens dos pedidos                        |
| `whatsapp_orders` | Histórico de pedidos enviados ao WhatsApp |

### Opção B — SQL (lista automática)

No **SQL Editor**, execute:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;
```

Confira se aparecem `profiles`, `products`, `orders`, `order_items`, `whatsapp_orders`.

### Storage (imagens)

Em **Storage**, deve existir o bucket **`product-images`** (criado pelo script). Se não aparecer, rode de novo a parte final do `schema.sql` relacionada a `storage.buckets` ou crie o bucket manualmente como público com o mesmo id.

## 6. Testar a conexão pelo app

Com `.env.local` correto e o schema aplicado:

1. Na pasta do projeto: `npm run dev` (ou `npm start`).
2. No navegador, abra: `http://localhost:3000/api/products`
   - Resposta esperada: JSON (lista de produtos, possivelmente `[]` se ainda não houver dados).
   - Se retornar **500**, veja a seção de problemas abaixo.

Opcional: insira um produto pelo admin (se já tiver usuário admin) e confira se aparece na loja e na API.

## 7. Login do admin (Supabase Auth + perfil `admin`)

O painel usa **Supabase Auth**. Quem se cadastra em **`/admin/cadastro`** envia o metadado `app_signup = admin_panel`; o trigger `handle_new_user` (no `schema.sql`) cria o perfil com **`role = 'admin'`** e `preferences` em JSON (preferências por usuário). **Não é obrigatório** rodar SQL manual para esses cadastros, desde que o banco esteja com a função `handle_new_user` **atualizada** (rode o script do repositório no SQL Editor se ainda não fez).

Usuários criados **só** pelo painel Supabase (Authentication → Users), sem esse metadado, ficam como **customer** — aí uso legado: promova com SQL ou cadastre-se pela app em `/admin/cadastro`.

Acesse `/admin/login` com o e-mail e senha. Em **Minha conta** (`/admin/configuracao`) cada gestor salva observações e opções só do próprio perfil.

### Confirmação de e-mail no cadastro

#### Ligar a validação por e-mail (cadastro só valida depois do link)

1. No Supabase, abra **Authentication** → **Providers** (ou **Sign In / Providers**).
2. Abra o provedor **Email** (não “Phone”).
3. Garanta que o login por e-mail/senha está **habilitado** e que **cadastros novos por e-mail** estão permitidos (no painel costuma ser **Enable email signup**, **Allow new users to sign up** ou similar). Se aparecer o erro *“Email signups are disabled”*, é porque essa opção está desligada — ative e salve.
4. Ative a opção de **confirmar e-mail** — no painel costuma aparecer como **Confirm email**, **Enable email confirmations** ou parecido (depende da versão). Com isso **ligado**, o `signUp` só passa a valer como “conta ativa” depois que o usuário clica no link do e-mail.

#### URLs para o link de confirmação funcionar

1. **Authentication** → **URL Configuration** (ou **Redirect URLs** na mesma área).
2. Em **Site URL**, use a URL base do app em produção (neste projeto: `https://loja-sr.vercel.app`).
3. Em **Redirect URLs**, inclua pelo menos:
   - `http://localhost:3000/auth/callback` (dev — troca o código do link de confirmação)
   - `http://localhost:3000/**` (opcional, coringa)
   - `https://loja-sr.vercel.app/auth/callback`
   - `https://loja-sr.vercel.app/**` (opcional, coringa)

O cadastro em `/admin/cadastro` usa `emailRedirectTo` apontando para `/auth/callback`. Se essa URL não estiver na lista do Supabase para o ambiente em que o usuário abre o link, a confirmação pode falhar ou cair na home com erro.

#### E-mail não chega ou vai para spam

- Plano gratuito: o Supabase envia e-mail pelo serviço padrão (há limites). Verifique **spam/lixo eletrônico**.
- Produção: em **Project Settings** → **Authentication** (ou **Auth**) → **SMTP** / **Custom SMTP**, configure um provedor (Resend, SendGrid, etc.) para envio confiável e domínio próprio.

#### Modelo do e-mail (texto do convite)

- **Authentication** → **Email Templates** → template **Confirm signup** (confirmação de cadastro). Ali você edita assunto e corpo; a variável do link de confirmação vem indicada no modelo padrão (não remova o `{{ .ConfirmationURL }}` ou equivalente do template).

#### Só para teste local (sem confirmação)

No mesmo **Email** provider, **desative** a confirmação obrigatória. Novos cadastros podem receber sessão na hora. Em produção é comum **manter a confirmação ligada**.

**Cadastrar produtos:** com sessão de admin aberta, o painel chama as rotas `/api/products` no servidor (service role). O bloqueio do painel é por sessão Auth + `role`; quem não é admin não vê o painel.

## Problemas comuns

| Sintoma | O que verificar |
|--------|------------------|
| `500` em `/api/products` | `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`; reiniciar o servidor; schema aplicado (colunas como `category` na tabela `products`). |
| Tabela não encontrada | Rodar `supabase/schema.sql` completo; checar erros no SQL Editor. |
| Lista vazia `[]` | Normal se não houver produtos; cadastre pelo admin ou insert manual em `products`. |
| Erro de extensão | O script usa `uuid-ossp`; em projetos novos costuma estar ok. |
| *Email signups are disabled* | **Authentication** → **Providers** → **Email** → habilite cadastro por e-mail / “Enable email signup”. |
| Cadastro bloqueia após muitos testes (rate limit) | Veja a seção **Limites de cadastro (rate limits)** abaixo. Não dá para desligar tudo; dá para **aumentar** o que for configurável. |

### Limites de cadastro (rate limits)

O Auth do Supabase aplica **limites por IP / por usuário** para evitar abuso. **Não existe opção de “desativar rate limit” por completo** no painel — é proteção da plataforma. O que você pode fazer:

1. **Ajustar o que for configurável**  
   No painel do projeto: **Authentication** → **Rate limits** (URL típica: `https://supabase.com/dashboard/project/SEU_REF/auth/rate-limits`). Ali aparecem períodos e cotas (confirmação de cadastro, OTP, e-mail, etc.). Aumente dentro do que o plano permitir para o ambiente de **testes**.

2. **Documentação oficial**  
   [Rate limits (Supabase)](https://supabase.com/docs/guides/auth/rate-limits) — explica quais limites são **customizáveis** e quais são **fixos**, e o uso da **Management API** para alterar `rate_limit_*` em projetos elegíveis.

3. **E-mail (provedor embutido)**  
   Limites de envio de e-mail do provedor interno costumam ser mais rígidos. Com **SMTP próprio** (configuração de e-mail no projeto) você ganha mais folga nos envios.

4. **Desenvolvimento**  
   Reduz tentativas extras: desative **Confirm email** só enquanto testa; use e-mails diferentes (`nome+1@gmail.com`, `nome+2@gmail.com`); espere o intervalo entre rajadas de teste.

Resumo: **não dá para zerar o rate limit**; dá para **subir valores**, **configurar SMTP**, e **mudar o fluxo de teste** para não bater no teto.

---

Depois que estiver tudo verde, o fluxo normal é: manter `.env.local` só na sua máquina, repetir as mesmas variáveis no painel do host (ex.: Vercel) em produção, e nunca commitar chaves `service_role`.

### GitHub / Vercel e o banco de dados

- **Push no GitHub** só atualiza **código**. Não envia variáveis de ambiente nem altera o Supabase.
- Na **Vercel** → **Settings** → **Environment Variables**, você precisa colar **as mesmas** variáveis do `.env.local` (em especial `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`). Sem isso, o build até pode passar, mas `/api/products` no ar não consegue falar com o banco.
- Os **produtos** vêm sempre do **mesmo projeto Supabase** configurado nessas variáveis. Cadastros no admin em produção gravam nesse projeto; o repositório Git não “leva” tabela nenhuma.
- Depois de alterar variáveis na Vercel, faça um **Redeploy** do último deployment para garantir que o runtime carregue os valores novos.

#### Checklist: produção na Vercel “não bate” com o banco / localhost

1. **Escopo das variáveis** — Na Vercel, cada variável pode estar só em **Production**, só em **Preview**, ou em **Development**. Se o deploy de produção (`main` → domínio principal) não tiver as chaves em **Production**, o app no ar usa valores vazios/errados. Previews de PR usam **Preview**; confira se copiou as mesmas chaves para o escopo que você está testando.
2. **Lista mínima** — `NEXT_PUBLIC_SUPABASE_URL`, **uma** chave pública (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` *ou* `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` (URL exata do deploy, ex.: `https://seu-projeto.vercel.app` ou domínio customizado **com** `https://`).
3. **Mesmo projeto Supabase** — Confira no painel Supabase (**Project Settings → API**) se a URL e as chaves coladas na Vercel são do **mesmo** projeto em que você rodou o `schema.sql` e cadastrou dados.
4. **Redeploy** — Depois de salvar variáveis, **Redeploy** (Deployments → ⋮ → Redeploy). Builds antigos não “puxam” env novos sozinhos no runtime.
5. **Teste rápido** — Abra `https://SEU-DOMINIO/api/products`: deve retornar JSON (mesmo que `[]`). **500** costuma indicar `SUPABASE_SERVICE_ROLE_KEY` ou URL ausente/errada no ambiente desse deploy.
6. **Auth / redirects** — Se o problema for login ou confirmação de e-mail no ar, em **Supabase → Authentication → URL Configuration** inclua `https://SEU-DOMINIO/auth/callback` (e **Site URL** coerente com produção).
