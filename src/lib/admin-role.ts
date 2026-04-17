import type { SupabaseClient } from "@supabase/supabase-js";

/** Chama API que promove a admin quem tem metadado de cadastro na área administrativa. */
export async function tryPromoteAdminFromSignup(): Promise<void> {
  if (typeof window === "undefined") return;
  await fetch("/api/profile/promote-admin", {
    method: "POST",
    credentials: "same-origin",
  });
}

export async function fetchProfileIsAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}
