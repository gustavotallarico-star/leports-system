import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {

    const rotaAtual = request.nextUrl.pathname;

    // ROTAS LIVRES
    const rotasPublicas = ["/login"];

    // SE FOR PÚBLICA
    if (rotasPublicas.includes(rotaAtual)) {
        return NextResponse.next();
    }

    // TOKEN
    const token = request.cookies.get("token");

    // NÃO LOGADO
    if (!token) {

        return NextResponse.redirect(
            new URL("/login", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/clientes/:path*",
        "/produtos/:path*",
        "/vendas/:path*",
        "/contas-receber/:path*",
        "/relatorios/:path*",
    ],
};