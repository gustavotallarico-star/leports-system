"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
    async function sair() {

        await supabase.auth.signOut();

        router.push("/login");
    }

    const router = useRouter();

    useEffect(() => {

        async function verificarLogin() {

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {

                router.push("/login");
            }
        }

        verificarLogin();

    }, [router]);

    const cards = [
        {
            titulo: "Vendas do Dia",
            valor: "R$ 3.250",
            icone: "💰",
        },
        {
            titulo: "Faturamento Mensal",
            valor: "R$ 48.900",
            icone: "📈",
        },
        {
            titulo: "Contas Vencidas",
            valor: "12",
            icone: "⚠️",
        },
        {
            titulo: "Clientes Inadimplentes",
            valor: "5",
            icone: "🚫",
        },
        {
            titulo: "Estoque Baixo",
            valor: "8 produtos",
            icone: "📦",
        },
        {
            titulo: "Últimas Vendas",
            valor: "18 hoje",
            icone: "🧾",
        },
    ];

    return (

        <div className="min-h-screen bg-gray-100 p-4 md:p-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">

                <div>

                    <h1 className="text-3xl md:text-4xl font-bold">
                        Leport's ERP
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Dashboard principal
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={sair}
                        className="bg-red-600 text-white px-5 py-3 rounded-2xl shadow-md"
                    >
                        Sair
                    </button>

                    <Link
                        href="/clientes"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:bg-gray-50"
                    >
                        Clientes
                    </Link>

                    <Link
                        href="/produtos"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:bg-gray-50"
                    >
                        Produtos
                    </Link>

                    <Link
                        href="/vendas"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:bg-gray-50"
                    >
                        Vendas
                    </Link>

                    <Link
                        href="/contas-receber"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:bg-gray-50"
                    >
                        Financeiro
                    </Link>

                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">

                {cards.map((card, index) => (

                    <div
                        key={index}
                        className="bg-white p-6 rounded-3xl shadow-md hover:shadow-xl transition-all"
                    >

                        <div className="flex items-center justify-between mb-4">

                            <h2 className="text-gray-500 text-sm">
                                {card.titulo}
                            </h2>

                            <span className="text-3xl">
                                {card.icone}
                            </span>

                        </div>

                        <p className="text-2xl md:text-3xl font-bold">
                            {card.valor}
                        </p>

                    </div>

                ))}

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white p-6 rounded-3xl shadow-md">

                    <h2 className="text-xl font-bold mb-6">
                        Últimas vendas
                    </h2>

                    <div className="space-y-4">

                        <div className="flex justify-between border-b pb-3">

                            <span>
                                João Silva
                            </span>

                            <span className="font-semibold">
                                R$ 420
                            </span>

                        </div>

                        <div className="flex justify-between border-b pb-3">

                            <span>
                                Maria Souza
                            </span>

                            <span className="font-semibold">
                                R$ 890
                            </span>

                        </div>

                        <div className="flex justify-between border-b pb-3">

                            <span>
                                Carlos Lima
                            </span>

                            <span className="font-semibold">
                                R$ 1.250
                            </span>

                        </div>

                    </div>

                </div>

                <div className="bg-white p-6 rounded-3xl shadow-md">

                    <h2 className="text-xl font-bold mb-6">
                        Resumo financeiro
                    </h2>

                    <div className="space-y-5">

                        <div>

                            <p className="text-gray-500 text-sm">
                                Entradas
                            </p>

                            <p className="text-2xl font-bold text-green-600">
                                R$ 48.900
                            </p>

                        </div>

                        <div>

                            <p className="text-gray-500 text-sm">
                                Saídas
                            </p>

                            <p className="text-2xl font-bold text-red-600">
                                R$ 17.300
                            </p>

                        </div>

                        <div>

                            <p className="text-gray-500 text-sm">
                                Lucro estimado
                            </p>

                            <p className="text-3xl font-bold">
                                R$ 31.600
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}