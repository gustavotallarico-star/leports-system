"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    FileText,
    Wallet
} from "lucide-react";

export default function Sidebar() {

    return (

        <aside className="w-64 h-screen bg-black text-white p-6">

            <h1 className="text-3xl font-bold mb-10">
                Leport's ERP
            </h1>

            <nav className="flex flex-col gap-3">

                {/* DASHBOARD */}
                <Link
                    href="/"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>

                {/* CLIENTES */}
                <Link
                    href="/clientes"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <Users size={18} />
                    Clientes
                </Link>

                {/* PRODUTOS */}
                <Link
                    href="/produtos"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <Package size={18} />
                    Produtos
                </Link>

                {/* VENDAS */}
                <Link
                    href="/vendas"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <ShoppingCart size={18} />
                    Vendas
                </Link>

                {/* CONTAS A RECEBER */}
                <Link
                    href="/contas-receber"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <Wallet size={18} />
                    Contas a Receber
                </Link>

                <Link
                    href="/financeiro"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <Wallet size={18} />
                    Financeiro
                </Link>

                {/* RELATÓRIOS */}
                <Link
                    href="/relatorios"
                    className="flex items-center gap-3 hover:bg-gray-800 p-3 rounded-xl"
                >
                    <FileText size={18} />
                    Relatórios
                </Link>

            </nav>

        </aside>
    );
}