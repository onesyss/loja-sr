"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PasswordInputWithToggle } from "@/components/PasswordInputWithToggle";
import { clearLegacyAdminStorage } from "@/lib/admin-auth";
import { userFacingAuthMessage } from "@/lib/auth-user-message";
import { createClient } from "@/lib/supabase/client";

function displayNameFromUser(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const meta = user.user_metadata ?? {};
  const full = meta.full_name;
  const name = meta.name;
  if (typeof full === "string" && full.trim()) return full.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return "";
}

export default function AdminConfiguracaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    setEmail(user.email ?? "");
    setName(displayNameFromUser(user));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileError("Indique o seu nome.");
      return;
    }
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { name: trimmed, full_name: trimmed },
    });
    setSavingProfile(false);
    if (error) {
      setProfileError(userFacingAuthMessage(error.message));
      return;
    }
    setProfileMessage("Dados salvos.");
    await loadSession();
    router.refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    if (!newPassword.trim()) {
      setPasswordError("Escreva a nova senha.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Use pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não conferem.");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(userFacingAuthMessage(error.message));
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Senha atualizada.");
  }

  async function runDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteError(
          typeof body.error === "string" ? body.error : "Não foi possível excluir a conta.",
        );
        setDeleting(false);
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      clearLegacyAdminStorage();
      setDeleteModalOpen(false);
      router.push("/admin/login");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-stone-500">Carregando sua conta…</div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-stone-900">Minha conta</h1>
      <p className="mt-2 text-sm text-stone-600">
        Os mesmos dados do cadastro: pode atualizar o nome, alterar a senha ou pedir a exclusão da
        conta.
      </p>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Dados do cadastro
        </h2>
        <form onSubmit={(e) => void handleSaveProfile(e)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="acc-name">
              Nome
            </label>
            <input
              id="acc-name"
              required
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="acc-email">
              E-mail
            </label>
            <input
              id="acc-email"
              type="email"
              readOnly
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-stone-600"
              value={email}
            />
            <p className="mt-1 text-xs text-stone-500">
              O e-mail não pode ser alterado aqui. Para mudar o e-mail, fale com o suporte do projeto.
            </p>
          </div>
          {profileError ? (
            <p className="text-sm text-red-700" role="alert">
              {profileError}
            </p>
          ) : null}
          {profileMessage ? (
            <p className="text-sm text-emerald-800" role="status">
              {profileMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {savingProfile ? "Salvando…" : "Salvar dados"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Alterar senha
        </h2>
        <form onSubmit={(e) => void handleChangePassword(e)} className="mt-4 space-y-4">
          <PasswordInputWithToggle
            id="acc-new-password"
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required={false}
          />
          <PasswordInputWithToggle
            id="acc-confirm-password"
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required={false}
          />
          {passwordError ? (
            <p className="text-sm text-red-700" role="alert">
              {passwordError}
            </p>
          ) : null}
          {passwordMessage ? (
            <p className="text-sm text-emerald-800" role="status">
              {passwordMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {savingPassword ? "Salvando…" : "Atualizar senha"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/40 p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-800/90">Zona de risco</h2>
        <p className="mt-2 text-sm text-stone-600">
          Excluir a conta remove o seu acesso ao painel e os dados associados a este utilizador.
        </p>
        {deleteError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {deleteError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setDeleteModalOpen(true);
          }}
          className="mt-4 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-800 transition hover:bg-red-50"
        >
          Excluir a minha conta
        </button>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Excluir conta?"
        description="Esta ação é permanente. Perderá o acesso ao painel administrativo com este e-mail."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setDeleteModalOpen(false);
        }}
        onConfirm={() => void runDeleteAccount()}
      />
    </div>
  );
}
