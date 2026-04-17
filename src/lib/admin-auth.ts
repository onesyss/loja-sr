export const ADMIN_SESSION_KEY = "sr-calcados-admin-session";
export const ADMIN_USER_KEY = "sr-calcados-admin-user";

export type AdminUser = {
  email: string;
  password: string;
  name?: string;
};

export function readAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAdminUser(user: AdminUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

/** Remove sessão antiga (antes do Supabase Auth); chamar após login real. */
export function clearLegacyAdminStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch {
    /* ignore */
  }
}
