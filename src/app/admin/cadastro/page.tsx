"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordInputWithToggle } from "@/components/PasswordInputWithToggle";
import { clearLegacyAdminStorage } from "@/lib/admin-auth";
import { APP_SIGNUP_ADMIN_PANEL } from "@/lib/admin-signup";
import { userFacingAuthMessage } from "@/lib/auth-user-message";
import { createClient } from "@/lib/supabase/client";

export default function AdminCadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** Sem sessão até o e-mail ser confirmado (envio do link de confirmação). */
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha nome, e-mail e senha.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Use uma senha com pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const emailRedirectTo = origin
      ? `${origin}/auth/callback?next=${encodeURIComponent("/admin/login")}`
      : undefined;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          full_name: name.trim(),
          app_signup: APP_SIGNUP_ADMIN_PANEL,
        },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (signUpError) {
      setError(userFacingAuthMessage(signUpError.message, { signup: true }));
      setLoading(false);
      return;
    }

    clearLegacyAdminStorage();

    if (!data.session) {
      setAwaitingEmailConfirm(true);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/admin");
    router.refresh();
  }

  if (awaitingEmailConfirm) {
    const emailDisplay = email.trim().toLowerCase();
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200/80 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">Cadastro concluído</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
            Confirme seu e-mail para continuar
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Enviamos uma mensagem para <strong className="text-stone-800">{emailDisplay}</strong>. Abra
            sua caixa de entrada e toque no link de confirmação. Se não encontrar, verifique a pasta
            de spam ou promoções.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Depois de confirmar, use{" "}
            <Link className="font-medium text-violet-700 underline-offset-2 hover:underline" href="/admin/login">
              entrar na área administrativa
            </Link>{" "}
            com o mesmo e-mail e senha. Quem se cadastra aqui passa a poder configurar a loja (perfil de
            gestor).
          </p>
          <Link
            href="/admin/login"
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            Ir para a tela de entrar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">Cadastro · Área administrativa</h1>
        <p className="mt-1 text-sm text-stone-600">Crie seu acesso para gerenciar a loja</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
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
            autoComplete="new-password"
          />
          <PasswordInputWithToggle
            id="confirm_password"
            label="Confirmar senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
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
            {loading ? "Salvando..." : "Criar conta"}
          </button>
        </form>
        <Link
          href="/admin/login"
          className="mt-6 block text-center text-sm text-stone-500 hover:text-violet-600"
        >
          Já tenho conta
        </Link>
      </div>
    </main>
  );
}
