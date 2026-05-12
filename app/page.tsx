"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verificarAuth } from "@/lib/protect";

interface ContaReceber {
    id: number;
    valor: number;
    parcela: number;
    total_parcelas: number;
    data_vencimento: string;
    status: string;
    clientes?: {
        nome: string;
    };
}

export default function Home() {

    const router = useRouter();

    const [loading, setLoading] =
        useState(true);

    const [dashboard, setDashboard] =
        useState({

            recebidoHoje: 0,

            recebidoMes: 0,

            aReceber: 0,

            vencidas: 0,

            vencemHoje: 0,

            inadimplentes: 0,

            estoqueBaixo: 0,

        });

    const [proximasCobrancas,
        setProximasCobrancas] =
        useState<ContaReceber[]>([]);

    useEffect(() => {

        verificarAuth(router);

        iniciarDashboard();

    }, [router]);

    async function iniciarDashboard() {

        setLoading(true);

        await atualizarParcelasAtrasadas();

        await carregarDashboard();

        setLoading(false);
    }

    async function atualizarParcelasAtrasadas() {

        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);

        await supabase
            .from("contas_receber")
            .update({
                status: "ATRASADO",
            })
            .lt(
                "data_vencimento",
                hoje.toISOString()
            )
            .eq("status", "PENDENTE");
    }

    async function carregarDashboard() {

        // =========================
        // DATAS
        // =========================

        const hojeInicio = new Date();

        hojeInicio.setHours(0, 0, 0, 0);

        const hojeFim = new Date();

        hojeFim.setHours(23, 59, 59, 999);

        const inicioMes = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        );

        // =========================
        // RECEBIDO HOJE
        // =========================

        const { data: recebidoHoje } =
            await supabase
                .from("contas_receber")
                .select("valor")
                .eq("status", "PAGO")
                .gte(
                    "data_pagamento",
                    hojeInicio.toISOString()
                )
                .lte(
                    "data_pagamento",
                    hojeFim.toISOString()
                );

        const totalRecebidoHoje =
            recebidoHoje?.reduce(
                (acc, item) =>
                    acc + Number(item.valor),
                0
            ) || 0;

        // =========================
        // RECEBIDO MÊS
        // =========================

        const { data: recebidoMes } =
            await supabase
                .from("contas_receber")
                .select("valor")
                .eq("status", "PAGO")
                .gte(
                    "data_pagamento",
                    inicioMes.toISOString()
                );

        const totalRecebidoMes =
            recebidoMes?.reduce(
                (acc, item) =>
                    acc + Number(item.valor),
                0
            ) || 0;

        // =========================
        // TOTAL A RECEBER
        // =========================

        const { data: pendentes } =
            await supabase
                .from("contas_receber")
                .select("valor")
                .in("status", [
                    "PENDENTE",
                    "ATRASADO"
                ]);

        const totalAReceber =
            pendentes?.reduce(
                (acc, item) =>
                    acc + Number(item.valor),
                0
            ) || 0;

        // =========================
        // CONTAS VENCIDAS
        // =========================

        const { data: vencidas } =
            await supabase
                .from("contas_receber")
                .select("*")
                .eq("status", "ATRASADO");

        // =========================
        // VENCEM HOJE
        // =========================

        const hojeString =
            hojeInicio
                .toISOString()
                .split("T")[0];

        const { data: vencemHoje } =
            await supabase
                .from("contas_receber")
                .select("*")
                .eq("status", "PENDENTE")
                .eq(
                    "data_vencimento",
                    hojeString
                );

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
        // PRÓXIMAS COBRANÇAS
        // =========================

        const { data: cobrancas } =
            await supabase
                .from("contas_receber")
                .select(`
                    *,
                    clientes(nome)
                `)
                .in("status", [
                    "PENDENTE",
                    "ATRASADO"
                ])
                .order(
                    "data_vencimento",
                    {
                        ascending: true,
                    }
                )
                .limit(10);

        setProximasCobrancas(
            cobrancas || []
        );

        // =========================
        // SET DASHBOARD
        // =========================

        setDashboard({

            recebidoHoje:
                totalRecebidoHoje,

            recebidoMes:
                totalRecebidoMes,

            aReceber:
                totalAReceber,

            vencidas:
                vencidas?.length || 0,

            vencemHoje:
                vencemHoje?.length || 0,

            inadimplentes:
                inadimplentes?.length || 0,

            estoqueBaixo:
                estoqueBaixo?.length || 0,

        });
    }

    const cards = [

        {
            titulo: "Recebido Hoje",
            valor:
                `R$ ${dashboard.recebidoHoje.toFixed(2)}`,
            icone: "💰",
        },

        {
            titulo: "Recebido no Mês",
            valor:
                `R$ ${dashboard.recebidoMes.toFixed(2)}`,
            icone: "📈",
        },

        {
            titulo: "Total a Receber",
            valor:
                `R$ ${dashboard.aReceber.toFixed(2)}`,
            icone: "🟠",
        },

        {
            titulo: "Contas Atrasadas",
            valor:
                dashboard.vencidas,
            icone: "🔴",
        },

        {
            titulo: "Vencem Hoje",
            valor:
                dashboard.vencemHoje,
            icone: "📅",
        },

        {
            titulo: "Clientes Inadimplentes",
            valor:
                dashboard.inadimplentes,
            icone: "🚫",
        },

        {
            titulo: "Estoque Baixo",
            valor:
                dashboard.estoqueBaixo,
            icone: "📦",
        },

    ];

    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <p className="text-xl">
                    Carregando dashboard...
                </p>

            </div>
        );
    }

    return (

        <div className="min-h-screen bg-gray-100 p-4 md:p-8">

            {/* HEADER */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">

                <div>

                    <h1 className="text-3xl md:text-4xl font-bold">
                        Leport's ERP
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Dashboard Financeiro
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <Link
                        href="/clientes"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition"
                    >
                        Clientes
                    </Link>

                    <Link
                        href="/produtos"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition"
                    >
                        Produtos
                    </Link>

                    <Link
                        href="/vendas"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition"
                    >
                        Vendas
                    </Link>

                    <Link
                        href="/financeiro"
                        className="bg-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition"
                    >
                        Financeiro
                    </Link>

                </div>

            </div>

            {/* CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

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

            {/* PRÓXIMAS COBRANÇAS */}

            <div className="bg-white p-6 rounded-3xl shadow-md">

                <div className="flex items-center justify-between mb-6">

                    <h2 className="text-2xl font-bold">
                        Próximas cobranças
                    </h2>

                    <Link
                        href="/financeiro/cobrancas"
                        className="text-blue-600 font-medium"
                    >
                        Ver todas
                    </Link>

                </div>

                <div className="space-y-4">

                    {proximasCobrancas.length === 0 && (

                        <p className="text-gray-500">
                            Nenhuma cobrança encontrada.
                        </p>

                    )}

                    {proximasCobrancas.map((item) => (

                        <div
                            key={item.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4"
                        >

                            <div>

                                <p className="font-semibold">
                                    {item.clientes?.nome}
                                </p>

                                <p className="text-sm text-gray-500">

                                    Parcela {item.parcela}

                                    {item.total_parcelas
                                        ? `/${item.total_parcelas}`
                                        : ""}

                                </p>

                            </div>

                            <div className="mt-2 md:mt-0 text-right">

                                <p className="font-bold text-lg">

                                    R$ {Number(item.valor).toFixed(2)}

                                </p>

                                <p className="text-sm text-gray-500">

                                    Vence em:

                                    {" "}

                                    {new Date(
                                        item.data_vencimento
                                    ).toLocaleDateString("pt-BR")}

                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}