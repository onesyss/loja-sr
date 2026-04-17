"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInputWithToggle } from "@/components/PasswordInputWithToggle";
import { clearLegacyAdminStorage } from "@/lib/admin-auth";
import { userFacingAuthMessage } from "@/lib/auth-user-message";
import { createClient } from "@/lib/supabase/client";

function motivoTexto(motivo: string | null): string | null {
  switch (motivo) {
    case "link_expirado":
      return "Este link de confirmação expirou ou já foi usado. Faça um novo cadastro ou entre com e-mail e senha se já tiver confirmado antes.";
    case "link_invalido":
      return "Não foi possível validar o link. Se já confirmou o e-mail, tente entrar abaixo. Caso contrário, cadastre-se de novo.";
    case "confirmar_falhou":
      return "A confirmação não pôde ser concluída. Tente entrar com seu e-mail e senha.";
    default:
      return null;
  }
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";
  const motivo = searchParams.get("motivo");
  const avisoTopo = motivoTexto(motivo);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!email.trim() || !password.trim()) {
      setError("Informe e-mail e senha.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signError || !data.user) {
      setError(userFacingAuthMessage(signError?.message));
      setLoading(false);
      return;
    }

    clearLegacyAdminStorage();
    setLoading(false);
    router.push(redirect);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">Entrar · Área administrativa</h1>
        <p className="mt-1 text-sm text-violet-600">SR CALÇADOS · Moda a seus pés</p>
        <p className="mt-3 text-sm text-stone-600">
          Entre com a mesma conta da loja para gerenciar produtos e pedidos.
        </p>
        {avisoTopo ? (
          <p
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-3 text-sm text-amber-950"
            role="status"
          >
            {avisoTopo}
          </p>
        ) : null}
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <PasswordInputWithToggle
            id="password"
            label="Senha"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-2.5 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <Link
          href="/admin/cadastro"
          className="mt-4 block text-center text-sm font-medium text-violet-600 hover:underline"
        >
          Criar conta
        </Link>
        <Link href="/" className="mt-6 block text-center text-sm text-stone-500 hover:text-violet-600">
          ← Voltar à loja
        </Link>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-100 text-sm text-stone-500">
          Carregando…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
