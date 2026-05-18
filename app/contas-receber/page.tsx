"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ContaReceber = {
    id: string;

    venda_id: string;
    cliente_id: string;

    valor: number;
    valor_pago: number;
    saldo_restante: number;

    parcela: number;
    total_parcelas: number;

    data_vencimento: string;
    data_pagamento?: string;

    status: string;
    forma_pagamento?: string;

    clientes?: {
        nome: string;
        telefone: string;
    } | null;
};

export default function ContasReceberPage() {

    const [contas, setContas] = useState<ContaReceber[]>([]);
    const [loading, setLoading] = useState(false);

    async function carregarContas() {

        setLoading(true);

        try {

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
                alert(error.message);
                return;
            }

            setContas(data || []);

        } catch (error: any) {

            console.error(error);
            alert("Erro ao carregar contas");

        } finally {

            setLoading(false);
        }
    }

    async function receberConta(conta: ContaReceber) {

        const confirmar = confirm(
            `Confirmar recebimento da parcela ${conta.parcela}/${conta.total_parcelas}?`
        );

        if (!confirmar) return;

        try {

            const { error } = await supabase
                .from("contas_receber")
                .update({
                    status: "Pago",
                    valor_pago: conta.valor,
                    saldo_restante: 0,
                    data_pagamento: new Date().toISOString(),
                })
                .eq("id", conta.id);

            if (error) {
                console.error(error);
                alert(error.message);
                return;
            }

            alert("Pagamento registrado");

            carregarContas();

        } catch (error: any) {

            console.error(error);
            alert("Erro ao receber conta");
        }
    }

    function formatarMoeda(valor: number) {

        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function formatarData(data: string) {

        if (!data) return "-";

        return new Date(data).toLocaleDateString("pt-BR");
    }

    const totalReceber = contas
        .filter((c) => c.status !== "Pago")
        .reduce((acc, item) => acc + Number(item.saldo_restante || 0), 0);

    const totalPago = contas
        .filter((c) => c.status === "Pago")
        .reduce((acc, item) => acc + Number(item.valor_pago || 0), 0);

    useEffect(() => {
        carregarContas();
    }, []);

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            <div className="flex justify-between items-center mb-8">

                <div>
                    <h1 className="text-2xl md:text-4xl font-bold">
                        Contas a Receber
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Controle financeiro das vendas parceladas
                    </p>
                </div>

                <button
                    onClick={carregarContas}
                    className="bg-black text-white px-5 py-3 rounded-xl"
                >
                    Atualizar
                </button>

            </div>

            {/* CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Total a Receber
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-red-600">
                        {formatarMoeda(totalReceber)}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Total Recebido
                    </p>

                    <h2 className="text-3xl font-bold mt-2 text-green-600">
                        {formatarMoeda(totalPago)}
                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 text-sm">
                        Parcelas
                    </p>

                    <h2 className="text-3xl font-bold mt-2">
                        {contas.length}
                    </h2>

                </div>

            </div>

            {/* TABELA */}

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1000px]">

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
                                Forma
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
                                    className="p-10 text-center text-gray-500"
                                >
                                    Carregando...
                                </td>
                            </tr>

                        ) : contas.length === 0 ? (

                            <tr>
                                <td
                                    colSpan={7}
                                    className="p-10 text-center text-gray-500"
                                >
                                    Nenhuma conta encontrada
                                </td>
                            </tr>

                        ) : (

                            contas.map((conta) => (

                                <tr
                                    key={conta.id}
                                    className="border-t"
                                >

                                    <td className="p-4">

                                        <div className="font-semibold">
                                            {conta.clientes?.nome || "Cliente"}
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            {conta.clientes?.telefone || "-"}
                                        </div>

                                    </td>

                                    <td className="p-4">

                                        {conta.parcela}/
                                        {conta.total_parcelas}

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

                                        ) : (

                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs">

                                                Pendente

                                            </span>

                                        )}

                                    </td>

                                    <td className="p-4">

                                        {conta.forma_pagamento || "-"}

                                    </td>

                                    <td className="p-4">

                                        {conta.status !== "Pago" && (

                                            <button
                                                onClick={() => receberConta(conta)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-xl"
                                            >
                                                Receber
                                            </button>

                                        )}

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