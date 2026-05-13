"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {

    const [totalVendas, setTotalVendas] = useState(0);
    const [totalClientes, setTotalClientes] = useState(0);
    const [totalProdutos, setTotalProdutos] = useState(0);
    const [totalReceber, setTotalReceber] = useState(0);

    const [contasHoje, setContasHoje] = useState<any[]>([]);
    const [totalHoje, setTotalHoje] = useState(0);

    const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);

    async function carregarDashboard() {

        // TOTAL VENDAS
        const { data: vendas } = await supabase
            .from("vendas")
            .select("total");

        const totalVendaValor = (vendas || []).reduce(
            (acc, item) => acc + Number(item.total || 0),
            0
        );

        setTotalVendas(totalVendaValor);

        // TOTAL CLIENTES
        const { count: clientesCount } = await supabase
            .from("clientes")
            .select("*", { count: "exact", head: true });

        setTotalClientes(clientesCount || 0);

        // TOTAL PRODUTOS
        const { count: produtosCount } = await supabase
            .from("produtos")
            .select("*", { count: "exact", head: true });

        setTotalProdutos(produtosCount || 0);

        // CONTAS A RECEBER
        const { data: contas } = await supabase
            .from("contas_receber")
            .select("saldo_restante, status")
            .neq("status", "Pago");

        const totalReceberValor = (contas || []).reduce(
            (acc, item) => acc + Number(item.saldo_restante || 0),
            0
        );

        setTotalReceber(totalReceberValor);

        // ÚLTIMAS VENDAS
        const { data: vendasRecentes } = await supabase
            .from("vendas")
            .select(`
                *,
                clientes (
                    nome
                )
            `)
            .order("created_at", { ascending: false })
            .limit(5);

        setUltimasVendas(vendasRecentes || []);
    }

    async function carregarRecebimentosHoje() {

        const hoje = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("contas_receber")
            .select(`
                *,
                clientes (
                    nome
                )
            `)
            .eq("data_vencimento", hoje)
            .neq("status", "Pago");

        if (error) {
            console.error(error);
            return;
        }

        setContasHoje(data || []);

        const total = (data || []).reduce(
            (acc, item) => acc + Number(item.valor || 0),
            0
        );

        setTotalHoje(total);
    }

    function formatarMoeda(valor: number) {

        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function formatarData(data: string) {

        return new Date(data).toLocaleDateString("pt-BR");
    }

    useEffect(() => {

        carregarDashboard();
        carregarRecebimentosHoje();

    }, []);

    return (

        <div className="p-8 bg-gray-100 min-h-screen">

            {/* HEADER */}

            <div className="mb-8">

                <h1 className="text-4xl font-bold">
                    Dashboard
                </h1>

                <p className="text-gray-500 mt-2">
                    Visão geral do sistema
                </p>

            </div>

            {/* CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Faturamento Total
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-green-600">
                        {formatarMoeda(totalVendas)}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Clientes
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-blue-600">
                        {totalClientes}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Produtos
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-purple-600">
                        {totalProdutos}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Contas a Receber
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-orange-600">
                        {formatarMoeda(totalReceber)}
                    </h2>

                </div>

            </div>

            {/* ALERTA RECEBIMENTOS */}

            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-2xl shadow-md mb-8">

                <div className="flex items-center justify-between">

                    <div>

                        <h2 className="text-2xl font-bold text-yellow-700">
                            Recebimentos de Hoje
                        </h2>

                        <p className="text-yellow-700 mt-2">

                            {contasHoje.length} cobrança(s) pendente(s)

                        </p>

                    </div>

                    <div className="text-right">

                        <p className="text-3xl font-bold text-yellow-700">

                            {formatarMoeda(totalHoje)}

                        </p>

                    </div>

                </div>

            </div>

            {/* COBRANÇAS */}

            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

                <div className="flex items-center justify-between mb-6">

                    <h2 className="text-2xl font-bold">
                        Cobranças do Dia
                    </h2>

                </div>

                {contasHoje.length === 0 ? (

                    <div className="text-center py-10 text-gray-500">

                        Nenhuma cobrança para hoje

                    </div>

                ) : (

                    <div className="space-y-4">

                        {contasHoje.map((conta) => (

                            <div
                                key={conta.id}
                                className="flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50"
                            >

                                <div>

                                    <p className="font-bold">
                                        {conta.clientes?.nome}
                                    </p>

                                    <p className="text-sm text-gray-500">

                                        Parcela {conta.parcela}/{conta.total_parcelas}

                                    </p>

                                </div>

                                <div className="text-right">

                                    <p className="font-bold text-green-600 text-lg">

                                        {formatarMoeda(conta.valor)}

                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

            {/* HISTÓRICO DE VENDAS */}

            <div className="bg-white rounded-2xl shadow-md p-6">

                <div className="flex items-center justify-between mb-6">

                    <h2 className="text-2xl font-bold">
                        Últimas Vendas
                    </h2>

                </div>

                {ultimasVendas.length === 0 ? (

                    <div className="text-center py-10 text-gray-500">

                        Nenhuma venda encontrada

                    </div>

                ) : (

                    <div className="overflow-auto">

                        <table className="w-full">

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="p-4 text-left">
                                        Cliente
                                    </th>

                                    <th className="p-4 text-left">
                                        Valor
                                    </th>

                                    <th className="p-4 text-left">
                                        Pagamento
                                    </th>

                                    <th className="p-4 text-left">
                                        Data
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {ultimasVendas.map((venda) => (

                                    <tr
                                        key={venda.id}
                                        className="border-t hover:bg-gray-50"
                                    >

                                        <td className="p-4">

                                            {venda.clientes?.nome || "Cliente"}

                                        </td>

                                        <td className="p-4 font-semibold text-green-600">

                                            {formatarMoeda(venda.total)}

                                        </td>

                                        <td className="p-4">

                                            {venda.forma_pagamento}

                                        </td>

                                        <td className="p-4">

                                            {formatarData(venda.created_at)}

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );
}