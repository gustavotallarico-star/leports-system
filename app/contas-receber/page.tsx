"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ContaReceber {
    id: number;
    cliente_id: number;
    venda_id: number;
    valor: number;
    valor_pago: number;
    saldo_restante: number;
    parcela: number;
    total_parcelas: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: string;
    forma_pagamento: string;

    clientes: {
        nome: string;
        telefone: string;
    }[];
}

export default function ContasReceberPage() {

    const [contas, setContas] = useState<ContaReceber[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarContas();
    }, []);

    async function carregarContas() {

        setLoading(true);

        const query = supabase
            .from("contas_receber")
            .select(`
                *,
                clientes (
                    nome,
                    telefone
                )
            `)
            .order("data_vencimento", { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao carregar contas:", error);
            setLoading(false);
            return;
        }

        setContas(data || []);
        setLoading(false);
    }

    async function marcarComoPago(id: number) {

        const conta = contas.find(c => c.id === id);

        if (!conta) return;

        const valorPago = conta.valor;

        const { error } = await supabase
            .from("contas_receber")
            .update({
                status: "Pago",
                valor_pago: valorPago,
                saldo_restante: 0,
                data_pagamento: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error(error);
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

    function formatarData(data: string | null) {

        if (!data) return "-";

        return new Date(data).toLocaleDateString("pt-BR");
    }

    return (
        <div className="p-6">

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">
                    Contas a Receber
                </h1>
            </div>

            <div className="bg-white rounded-2xl shadow overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">
                        <tr>

                            <th className="text-left p-4">Cliente</th>
                            <th className="text-left p-4">Telefone</th>
                            <th className="text-left p-4">Parcela</th>
                            <th className="text-left p-4">Valor</th>
                            <th className="text-left p-4">Vencimento</th>
                            <th className="text-left p-4">Pagamento</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Ações</th>

                        </tr>
                    </thead>

                    <tbody>

                        {loading && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="p-6 text-center"
                                >
                                    Carregando...
                                </td>
                            </tr>
                        )}

                        {!loading && contas.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="p-6 text-center"
                                >
                                    Nenhuma conta encontrada.
                                </td>
                            </tr>
                        )}

                        {!loading && contas.map((conta) => {

                            const cliente = conta.clientes?.[0];

                            return (
                                <tr
                                    key={conta.id}
                                    className="border-t"
                                >

                                    <td className="p-4">
                                        {cliente?.nome || "-"}
                                    </td>

                                    <td className="p-4">
                                        {cliente?.telefone || "-"}
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
                                        {formatarData(conta.data_pagamento)}
                                    </td>

                                    <td className="p-4">

                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium
                                            ${conta.status === "Pago"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {conta.status}
                                        </span>

                                    </td>

                                    <td className="p-4">

                                        {conta.status !== "Pago" && (
                                            <button
                                                onClick={() => marcarComoPago(conta.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                            >
                                                Receber
                                            </button>
                                        )}

                                    </td>

                                </tr>
                            );
                        })}

                    </tbody>

                </table>

            </div>

        </div>
    );
}