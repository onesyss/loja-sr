"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ADMIN_SESSION_KEY,
  writeAdminUser,
} from "@/lib/admin-auth";

export default function AdminCadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha nome, e-mail e senha.");
      setLoading(false);
      return;
    }
    if (password.length < 4) {
      setError("Use uma senha com pelo menos 4 caracteres.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }

    writeAdminUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        loggedAt: new Date().toISOString(),
      }),
    );
    setLoading(false);
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">Cadastro · Admin</h1>
        <p className="mt-1 text-sm text-violet-600">Crie seu acesso ao painel</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-stone-700"
              htmlFor="confirm_password"
            >
              Confirmar senha
            </label>
            <input
              id="confirm_password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
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
            {loading ? "Salvando..." : "Criar conta admin"}
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
