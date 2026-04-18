import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseService } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component não permite set em alguns contextos */
          }
        },
      },
    },
  );
}

function getServiceRoleConfig(): { url: string; key: string } | null {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

/** Cliente com service role, ou `null` se URL/chave não estiverem definidos (evita 500 opaco nas rotas). */
export function createServiceClientOrNull() {
  const cfg = getServiceRoleConfig();
  if (!cfg) return null;
  return createSupabaseService(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServiceClient() {
  const cfg = getServiceRoleConfig();
  if (!cfg) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou URL ausente");
  }
  return createSupabaseService(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
