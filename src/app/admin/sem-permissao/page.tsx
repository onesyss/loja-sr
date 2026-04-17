import { redirect } from "next/navigation";

/** Legado: antes havia bloqueio por perfil; agora qualquer sessão válida usa o painel. */
export default function AdminSemPermissaoRedirect() {
  redirect("/admin");
}
