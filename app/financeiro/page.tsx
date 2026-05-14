"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FinanceiroPage() {

    const [faturamentoHoje, setFaturamentoHoje] =
        useState(0);

    const [faturamentoMes, setFaturamentoMes] =
        useState(0);

    const [contasReceber, setContasReceber] =
        useState(0);

    const [lucro, setLucro] =
        useState(0);

    async function carregarFinanceiro() {

        // =========================
        // VENDAS
        // =========================

        const { data: vendas } = await supabase
            .from("vendas")
            .select("total, created_at");

        const hoje = new Date();

        let totalHoje = 0;
        let totalMes = 0;

        vendas?.forEach((venda: any) => {

            const dataVenda =
                new Date(venda.created_at);

            // HOJE
            if (
                dataVenda.toDateString() ===
                hoje.toDateString()
            ) {

                totalHoje +=
                    Number(venda.total);
            }

            // MÊS
            if (
                dataVenda.getMonth() ===
                hoje.getMonth() &&

                dataVenda.getFullYear() ===
                hoje.getFullYear()
            ) {

                totalMes +=
                    Number(venda.total);
            }
        });

        setFaturamentoHoje(totalHoje);

        setFaturamentoMes(totalMes);

        // =========================
        // CONTAS A RECEBER
        // =========================

        const { data: contas } = await supabase
            .from("contas_receber")
            .select("saldo_restante, status");

        let totalReceber = 0;

        contas?.forEach((conta: any) => {

            if (
                conta.status === "Pendente"
            ) {

                totalReceber +=
                    Number(conta.saldo_restante);
            }
        });

        setContasReceber(totalReceber);

        // =========================
        // LUCRO
        // =========================

        setLucro(
            totalMes * 0.35
        );
    }

    useEffect(() => {

        carregarFinanceiro();

    }, []);

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Financeiro
            </h1>

            <div className="grid grid-cols-4 gap-6">

                {/* FATURAMENTO HOJE */}

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Faturamento Hoje
                    </p>

                    <h2 className="text-3xl font-bold text-green-600">

                        R$ {faturamentoHoje.toFixed(2)}

                    </h2>

                </div>

                {/* FATURAMENTO MÊS */}

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Faturamento Mensal
                    </p>

                    <h2 className="text-3xl font-bold text-blue-600">

                        R$ {faturamentoMes.toFixed(2)}

                    </h2>

                </div>

                {/* CONTAS A RECEBER */}

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Contas a Receber
                    </p>

                    <h2 className="text-3xl font-bold text-orange-600">

                        R$ {contasReceber.toFixed(2)}

                    </h2>

                </div>

                {/* LUCRO */}

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Lucro Estimado
                    </p>

                    <h2 className="text-3xl font-bold text-purple-600">

                        R$ {lucro.toFixed(2)}

                    </h2>

                </div>

            </div>

        </div>
    );
}