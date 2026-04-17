"use client";

import { useEffect, useState } from "react";
import type { ProfilePreferences, ProfileRow } from "@/types/database";

export default function AdminConfiguracaoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privateNote, setPrivateNote] = useState("");
  const [storefrontHighlight, setStorefrontHighlight] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/profile", { credentials: "same-origin" });
        const data = (await res.json()) as ProfileRow | null;
        if (cancelled || !data?.preferences) return;
        const p = data.preferences as ProfilePreferences;
        setPrivateNote(p.private_note ?? "");
        setStorefrontHighlight(p.storefront_highlight ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            private_note: privateNote.trim() || undefined,
            storefront_highlight: storefrontHighlight.trim() || undefined,
          },
        }),
      });
      if (!res.ok) {
        setMessage("Não foi possível salvar. Tente de novo.");
        return;
      }
      setMessage("Preferências salvas.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-stone-500">Carregando suas preferências…</div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-stone-900">Minha conta</h1>
      <p className="mt-2 text-sm text-stone-600">
        Cada pessoa com acesso ao painel pode guardar observações e um destaque opcional — só para o
        seu perfil, sem misturar com o de outro usuário.
      </p>

      <form onSubmit={(e) => void handleSave(e)} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="note">
            Observação pessoal (só você vê no painel)
          </label>
          <textarea
            id="note"
            rows={4}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
            placeholder="Lembretes, fornecedores, metas da semana…"
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="highlight">
            Destaque na vitrine (opcional)
          </label>
          <input
            id="highlight"
            type="text"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
            placeholder="Frase extra para o banner da loja (pode ser usada no site)"
            value={storefrontHighlight}
            onChange={(e) => setStorefrontHighlight(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-500">
            O uso no site depende do tema; os dados ficam salvos no seu perfil.
          </p>
        </div>
        {message ? (
          <p className="text-sm text-violet-700" role="status">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar preferências"}
        </button>
      </form>
    </div>
  );
}
