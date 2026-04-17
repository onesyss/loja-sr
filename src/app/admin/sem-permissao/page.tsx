"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminSemPermissaoPage() {
  const router = useRouter();

  async function handleSair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-amber-200/90 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-amber-800">Acesso restrito</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
          Sua conta ainda não pode gerenciar a loja
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          Você entrou com sucesso, mas este perfil ainda não está autorizado a alterar produtos e
          pedidos no painel. Isso é normal após um cadastro novo.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          Este e-mail entrou como visitante da loja ou foi criado fora do cadastro de gestão. Para
          acessar o painel, use a opção <strong className="text-stone-800">Criar conta</strong> na área
          administrativa ou peça ajuda a quem cuida do site.
        </p>
        <details className="mt-6 rounded-xl border border-stone-200 bg-stone-50/90 text-left">
          <summary className="cursor-pointer list-inside px-4 py-3 text-sm font-medium text-stone-800 marker:text-violet-600">
            Se você é quem configura a loja — liberar seu próprio acesso
          </summary>
          <div className="border-t border-stone-200 px-4 py-3 text-sm text-stone-600">
            <p>
              No painel do banco de dados do projeto (onde a loja está ligada), abra{" "}
              <strong className="text-stone-800">Autenticação → Usuários</strong>, copie o ID do seu
              usuário e rode no <strong className="text-stone-800">Editor SQL</strong>:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-stone-900/90 p-3 text-xs leading-relaxed text-stone-100">
              {`update public.profiles
set role = 'admin'
where id = 'COLE_AQUI_O_ID_DO_USUARIO';`}
            </pre>
            <p className="mt-3 text-xs text-stone-500">
              Depois volte aqui, use &quot;Sair&quot; e entre de novo com o mesmo e-mail e senha.
            </p>
          </div>
        </details>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSair()}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
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
