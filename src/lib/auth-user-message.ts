type AuthMessageOptions = {
  /** Cadastro: texto específico quando o serviço bloqueia por muitas tentativas (rate limit). */
  signup?: boolean;
};

/** Texto amigável para o usuário final (evita inglês técnico do provedor de autenticação). */
export function userFacingAuthMessage(
  raw: string | undefined | null,
  options?: AuthMessageOptions,
): string {
  const m = (raw ?? "").toLowerCase();
  if (!m.trim()) {
    return "Algo não funcionou. Tente de novo em instantes.";
  }
  if (m.includes("signups are disabled")) {
    return "Novos cadastros não estão disponíveis no momento. Fale com a loja ou tente mais tarde.";
  }
  if (m.includes("already registered") || m.includes("user already registered")) {
    return "Já existe uma conta com este e-mail. Use «Já tenho conta» para entrar.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  }
  if (m.includes("password") && m.includes("least")) {
    return "Use uma senha mais forte ou com o mínimo de caracteres exigido.";
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    if (options?.signup) {
      return "Após várias tentativas seguidas, o cadastro fica bloqueado por alguns minutos (limite do servidor — não significa que seus dados estão errados). Aguarde e tente de novo, ou use outro e-mail para testar.";
    }
    return "Muitas tentativas seguidas. Aguarde um pouco e tente outra vez.";
  }
  return "Não foi possível continuar. Confira os dados ou tente de novo mais tarde.";
}
