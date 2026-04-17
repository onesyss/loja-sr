import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseService } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublishableKey } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou URL ausente");
  }
  return createSupabaseService(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
