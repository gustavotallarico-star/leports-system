"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ContaReceber = {
    id: string;
    venda_id: string;
    cliente_id: string;
    parcela: number;
    total_parcelas: number;
    valor: number;
    valor_pago: number;
    saldo_restante: number;
    status: string;
    forma_pagamento: string;
    data_vencimento: string;
    data_pagamento: string | null;
    created_at: string;

    clientes: {
        nome: string;
        telefone: string;
    } | null;
};

export default function ContasReceberPage() {

    const [contas, setContas] = useState<ContaReceber[]>([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(false);

    async function carregarContas() {

        setLoading(true);

        const { data, error } = await supabase
            .from("contas_receber")
            .select(`
                *,
                clientes (
                    nome,
                    telefone
                )
            `)
            .order("data_vencimento", { ascending: true });

        if (error) {
            console.error(error);
            alert("Erro ao carregar contas");
            setLoading(false);
            return;
        }

        setContas((data as ContaReceber[]) || []);

        setLoading(false);
    }

    async function marcarComoPago(conta: ContaReceber) {

        const valorPago = conta.valor;

        const { error } = await supabase
            .from("contas_receber")
            .update({
                status: "Pago",
                valor_pago: valorPago,
                saldo_restante: 0,
                data_pagamento: new Date().toISOString(),
            })
            .eq("id", conta.id);

        if (error) {
            console.error(error);
            alert("Erro ao atualizar conta");
            return;
        }

        carregarContas();
    }

    async function voltarParaPendente(conta: ContaReceber) {

        const { error } = await supabase
            .from("contas_receber")
            .update({
                status: "Pendente",
                valor_pago: 0,
                saldo_restante: conta.valor,
                data_pagamento: null,
            })
            .eq("id", conta.id);

        if (error) {
            console.error(error);
            alert("Erro ao atualizar conta");
            return;
        }

        carregarContas();
    }

    async function excluirConta(id: string) {

        const confirmar = confirm("Deseja realmente excluir esta conta?");

        if (!confirmar) return;

        const { error } = await supabase
            .from("contas_receber")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            alert("Erro ao excluir");
            return;
        }

        carregarContas();
    }

    function formatarMoeda(valor: number) {

        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function formatarData(data: string) {

        if (!data) return "-";

        return new Date(data).toLocaleDateString("pt-BR");
    }

    const contasFiltradas = contas.filter((conta) => {

        const termo = busca.toLowerCase();

        return (
            conta.clientes?.nome?.toLowerCase().includes(termo) ||
            conta.forma_pagamento?.toLowerCase().includes(termo) ||
            conta.status?.toLowerCase().includes(termo)
        );
    });

    const totalReceber = contas
        .filter((c) => c.status !== "Pago")
        .reduce((acc, item) => acc + Number(item.saldo_restante || 0), 0);

    const totalRecebido = contas
        .filter((c) => c.status === "Pago")
        .reduce((acc, item) => acc + Number(item.valor_pago || 0), 0);

    const contasVencidas = contas.filter((c) => {

        if (c.status === "Pago") return false;

        return new Date(c.data_vencimento) < new Date();

    }).length;

    useEffect(() => {
        carregarContas();
    }, []);

    return (

        <div className="p-8 bg-gray-100 min-h-screen">

            <div className="flex items-center justify-between mb-8">

                <div>

                    <h1 className="text-4xl font-bold">
                        Contas a Receber
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Gestão financeira das vendas parceladas
                    </p>

                </div>

            </div>

            {/* CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Total a Receber
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-blue-600">
                        {formatarMoeda(totalReceber)}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Total Recebido
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-green-600">
                        {formatarMoeda(totalRecebido)}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Contas Vencidas
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-red-600">
                        {contasVencidas}
                    </h2>

                </div>

            </div>

            {/* BUSCA */}

            <div className="bg-white p-4 rounded-2xl shadow-md mb-6">

                <input
                    type="text"
                    placeholder="Buscar cliente, status ou forma de pagamento..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full border p-4 rounded-xl"
                />

            </div>

            {/* TABELA */}

            <div className="bg-white rounded-2xl shadow-md overflow-auto">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-4 text-left">
                                Cliente
                            </th>

                            <th className="p-4 text-left">
                                Parcela
                            </th>

                            <th className="p-4 text-left">
                                Valor
                            </th>

                            <th className="p-4 text-left">
                                Vencimento
                            </th>

                            <th className="p-4 text-left">
                                Status
                            </th>

                            <th className="p-4 text-left">
                                Pagamento
                            </th>

                            <th className="p-4 text-left">
                                Ações
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {loading ? (

                            <tr>

                                <td
                                    colSpan={7}
                                    className="p-8 text-center text-gray-500"
                                >
                                    Carregando...
                                </td>

                            </tr>

                        ) : contasFiltradas.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={7}
                                    className="p-8 text-center text-gray-500"
                                >
                                    Nenhuma conta encontrada
                                </td>

                            </tr>

                        ) : (

                            contasFiltradas.map((conta) => (

                                <tr
                                    key={conta.id}
                                    className="border-t hover:bg-gray-50"
                                >

                                    <td className="p-4">

                                        <div className="font-semibold">
                                            {conta.clientes?.nome || "Cliente"}
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            {conta.clientes?.telefone}
                                        </div>

                                    </td>

                                    <td className="p-4">

                                        {conta.parcela}/{conta.total_parcelas}

                                    </td>

                                    <td className="p-4 font-semibold">

                                        {formatarMoeda(conta.valor)}

                                    </td>

                                    <td className="p-4">

                                        {formatarData(conta.data_vencimento)}

                                    </td>

                                    <td className="p-4">

                                        {conta.status === "Pago" ? (

                                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                                                Pago
                                            </span>

                                        ) : new Date(conta.data_vencimento) < new Date() ? (

                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs">
                                                Vencido
                                            </span>

                                        ) : (

                                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs">
                                                Pendente
                                            </span>

                                        )}

                                    </td>

                                    <td className="p-4">

                                        {conta.forma_pagamento}

                                    </td>

                                    <td className="p-4">

                                        <div className="flex gap-2">

                                            {conta.status !== "Pago" ? (

                                                <button
                                                    onClick={() => marcarComoPago(conta)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    Receber
                                                </button>

                                            ) : (

                                                <button
                                                    onClick={() => voltarParaPendente(conta)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    Reabrir
                                                </button>

                                            )}

                                            <button
                                                onClick={() => excluirConta(conta.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                                            >
                                                Excluir
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );
}