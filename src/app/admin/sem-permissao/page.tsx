"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchProfileIsAdmin, tryPromoteAdminFromSignup } from "@/lib/admin-role";
import { createClient } from "@/lib/supabase/client";

export default function AdminSemPermissaoPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function tryEnter() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      await tryPromoteAdminFromSignup();
      const isAdmin = await fetchProfileIsAdmin(supabase, user.id);
      if (cancelled) return;
      if (isAdmin) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setChecking(false);
    }

    void tryEnter();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  async function handleTentarNovamente() {
    setRetrying(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRetrying(false);
      router.push("/admin/login");
      return;
    }
    await tryPromoteAdminFromSignup();
    const isAdmin = await fetchProfileIsAdmin(supabase, user.id);
    setRetrying(false);
    if (isAdmin) {
      router.replace("/admin");
      router.refresh();
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-10">
        <p className="text-sm text-stone-500">Verificando permissão…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-amber-200/90 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-amber-800">Acesso restrito</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
          Esta conta não é de gestão da loja
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          Quem vai administrar precisa <strong className="text-stone-800">criar a conta pelo painel</strong>, em{" "}
          <strong className="text-stone-800">Criar conta</strong> na área administrativa — assim o sistema marca o
          cadastro como gestor.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Se a pessoa se cadastrou só na loja (como cliente), use outro e-mail ou peça para se registrar em{" "}
          <span className="font-medium text-stone-800">/admin/cadastro</span> no site publicado.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleTentarNovamente()}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {retrying ? "Verificando…" : "Já cadastrei no painel — tentar de novo"}
          </button>
          <Link
            href="/admin/cadastro"
            className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-2.5 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
          >
            Ir para criar conta (gestor)
          </Link>
          <button
            type="button"
            onClick={() => void handleSair()}
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Sair e usar outra conta
          </button>
          <Link
            href="/"
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    </main>
  );
}
