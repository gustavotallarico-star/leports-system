"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verificarAuth } from "@/lib/protect";

export default function Home() {

    const router = useRouter();

    const [dashboard, setDashboard] = useState({

        vendasHoje: 0,
        faturamentoMensal: 0,
        contasVencidas: 0,
        inadimplentes: 0,
        estoqueBaixo: 0,

    });

    const [ultimasVendas, setUltimasVendas] =
        useState<any[]>([]);

    useEffect(() => {

        verificarAuth(router);

        carregarDashboard();

    }, [router]);

    async function carregarDashboard() {

        // =========================
        // DATA HOJE
        // =========================

        const hoje =
            new Date()
                .toISOString()
                .split("T")[0];

        const inicioMes =
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
            )
                .toISOString();

        // =========================
        // VENDAS HOJE
        // =========================

        const { data: vendasHoje } =
            await supabase
                .from("vendas")
                .select("valor_total, created_at")
                .gte("created_at", hoje);

        const totalHoje =
            vendasHoje?.reduce(
                (acc, venda) =>
                    acc + Number(venda.valor_total),
                0
            ) || 0;

        // =========================
        // FATURAMENTO MENSAL
        // =========================

        const { data: vendasMes } =
            await supabase
                .from("vendas")
                .select("valor_total")
                .gte("created_at", inicioMes);

        const totalMes =
            vendasMes?.reduce(
                (acc, venda) =>
                    acc + Number(venda.valor_total),
                0
            ) || 0;

        // =========================
        // CONTAS VENCIDAS
        // =========================

        const { data: contasVencidas } =
            await supabase
                .from("contas_receber")
                .select("*")
                .eq("status", "pendente")
                .lt("data_vencimento", hoje);

        // =========================
        // CLIENTES INADIMPLENTES
        // =========================

        const { data: inadimplentes } =
            await supabase
                .from("clientes")
                .select("*")
                .eq("inadimplente", true);

        // =========================
        // ESTOQUE BAIXO
        // =========================

        const { data: estoqueBaixo } =
            await supabase
                .from("produtos")
                .select("*")
                .lte("estoque", 5);

        // =========================
        // ÚLTIMAS VENDAS
        // =========================

        const { data: ultimas } =
            await supabase
                .from("vendas")
                .select(`
                    *,
                    clientes(nome)
                `)
                .order("created_at", {
                    ascending: false,
                })
                .limit(5);

        setUltimasVendas(ultimas || []);

        setDashboard({

            vendasHoje: totalHoje,

            faturamentoMensal: totalMes,

            contasVencidas:
                contasVencidas?.length || 0,

            inadimplentes:
                inadimplentes?.length || 0,

            estoqueBaixo:
                estoqueBaixo?.length || 0,

        });
    }

    const cards = [

        {
            titulo: "Vendas do Dia",
            valor: `R$ ${dashboard.vendasHoje.toFixed(2)}`,
            icone: "💰",
        },

        {
            titulo: "Faturamento Mensal",
            valor: `R$ ${dashboard.faturamentoMensal.toFixed(2)}`,
            icone: "📈",
        },

        {
            titulo: "Contas Vencidas",
            valor: dashboard.contasVencidas,
            icone: "⚠️",
        },

        {
            titulo: "Clientes Inadimplentes",
            valor: dashboard.inadimplentes,
            icone: "🚫",
        },

        {
            titulo: "Estoque Baixo",
            valor: dashboard.estoqueBaixo,
            icone: "📦",
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
                        Dashboard profissional
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <Link
                        href="/clientes"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md"
                    >
                        Clientes
                    </Link>

                    <Link
                        href="/produtos"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md"
                    >
                        Produtos
                    </Link>

                    <Link
                        href="/vendas"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md"
                    >
                        Vendas
                    </Link>

                    <Link
                        href="/contas-receber"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md"
                    >
                        Financeiro
                    </Link>

                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">

                {cards.map((card, index) => (

                    <div
                        key={index}
                        className="bg-white p-6 rounded-3xl shadow-md"
                    >

                        <div className="flex items-center justify-between mb-4">

                            <h2 className="text-gray-500 text-sm">
                                {card.titulo}
                            </h2>

                            <span className="text-3xl">
                                {card.icone}
                            </span>

                        </div>

                        <p className="text-3xl font-bold">
                            {card.valor}
                        </p>

                    </div>

                ))}

            </div>

            <div className="bg-white p-6 rounded-3xl shadow-md">

                <h2 className="text-2xl font-bold mb-6">
                    Últimas vendas
                </h2>

                <div className="space-y-4">

                    {ultimasVendas.map((venda) => (

                        <div
                            key={venda.id}
                            className="flex justify-between border-b pb-3"
                        >

                            <span>
                                {venda.clientes?.nome || "Cliente"}
                            </span>

                            <span className="font-bold">
                                R$ {Number(venda.valor_total).toFixed(2)}
                            </span>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}