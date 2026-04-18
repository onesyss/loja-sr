/**
 * Chave pública do projeto: aceita nome novo (Publishable) ou legado (anon).
 * Importante: `??` não ignora string vazia — se ANON="" no .env, antes caía nisso
 * e o cliente recebia chave vazia ("Invalid Compact JWS"). Por isso ignoramos vazio.
 */
export function getSupabasePublishableKey(): string {
  const a = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const b = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (a) return a;
  if (b) return b;
  return "";
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}
