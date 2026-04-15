"use client";

import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-stone-600 hover:text-violet-600"
    >
      Sair
    </button>
  );
}
