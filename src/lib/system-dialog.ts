/** Alerta nativo do navegador (`window.alert`). */
export function systemAlert(message: string): void {
  if (typeof window === "undefined") return;
  window.alert(message);
}
