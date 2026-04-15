import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  void request;
  // Modo temporário sem Supabase: libera todas as rotas sem autenticação.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
