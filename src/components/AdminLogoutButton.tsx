"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearLegacyAdminStorage } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/client";

export function AdminLogoutButton() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleLogout() {
    setConfirmOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearLegacyAdminStorage();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="text-sm text-stone-600 hover:text-violet-600"
      >
        Sair
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-dialog-title"
              className="text-lg font-semibold text-stone-900"
            >
              Sair da área administrativa?
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Você precisará fazer login novamente para acessar o painel.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                onClick={() => setConfirmOpen(false)}
              >
                Não
              </button>
              <button
                type="button"
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                onClick={() => void handleLogout()}
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
