"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verificarAuth } from "@/lib/protect";

interface ContaReceber {

    id: string;

    cliente_id: string;

    venda_id: string;

    valor: number;

    valor_pago: number;

    saldo_restante: number;

    parcela: number;

    total_parcelas: number;

    data_vencimento: string;

    data_pagamento?: string;

    status: string;

    forma_pagamento?: string;

    observacao?: string;

    clientes?: {

        nome: string;

        telefone: string;
    };
}

export default function ContasReceberPage() {

    const router = useRouter();

    const [loading, setLoading] =
        useState(true);

    const [contas, setContas] =
        useState<ContaReceber[]>([]);

    const [filtro, setFiltro] =
        useState("TODOS");

    const [busca, setBusca] =
        useState("");

    useEffect(() => {

        verificarAuth(router);

        iniciarPagina();

    }, [router]);

    async function iniciarPagina() {

        setLoading(true);

        await atualizarAtrasadas();

        await carregar();

        setLoading(false);
    }

    // =========================
    // ATUALIZAR ATRASADAS
    // =========================

    async function atualizarAtrasadas() {

        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);

        await supabase

            .from("contas_receber")

            .update({
                status: "ATRASADO"
            })

            .lt(
                "data_vencimento",
                hoje.toISOString()
            )

            .eq("status", "PENDENTE");
    }

    // =========================
    // CARREGAR
    // =========================

    async function carregar() {

        let query = supabase

            .from("contas_receber")

            .select(`
                id,
                cliente_id,
                venda_id,
                valor,
                valor_pago,
                saldo_restante,
                parcela,
                total_parcelas,
                data_vencimento,
                data_pagamento,
                status,
                forma_pagamento,
                clientes(
                    nome,
                    telefone
                )
            `)

            .order(
                "data_vencimento",
                {
                    ascending: true,
                }
            );

        if (busca) {

            query = query.ilike(
                "clientes.nome",
                `%${busca}%`
            );
        }

        const { data } = await query;

        setContas(data || []);
    }

    // =========================
    // RECEBER PAGAMENTO
    // =========================

    async function receberPagamento(
        conta: ContaReceber
    ) {

        const valor =
            prompt(
                `Valor recebido da parcela:\nSaldo restante: R$ ${Number(
                    conta.saldo_restante || conta.valor
                ).toFixed(2)}`
            );

        if (!valor) return;

        const valorRecebido =
            Number(valor);

        if (
            isNaN(valorRecebido) ||
            valorRecebido <= 0
        ) {

            alert("Valor inválido");

            return;
        }

        const valorAtualPago =
            Number(conta.valor_pago || 0);

        const valorTotal =
            Number(conta.valor);

        const novoValorPago =
            valorAtualPago +
            valorRecebido;

        const novoSaldo =
            valorTotal -
            novoValorPago;

        let status = "PENDENTE";

        if (novoSaldo <= 0) {

            status = "PAGO";

        } else {

            status = "PARCIAL";
        }

        await supabase

            .from("contas_receber")

            .update({

                valor_pago:
                    novoValorPago,

                saldo_restante:
                    novoSaldo <= 0
                        ? 0
                        : novoSaldo,

                data_pagamento:
                    status === "PAGO"
                        ? new Date().toISOString()
                        : null,

                status,
            })

            .eq("id", conta.id);

        // =========================
        // REGISTRO RECEBIMENTO
        // =========================

        await supabase

            .from("recebimentos")

            .insert([

                {

                    conta_receber_id:
                        conta.id,

                    cliente_id:
                        conta.cliente_id,

                    venda_id:
                        conta.venda_id,

                    valor:
                        valorRecebido,

                    forma_pagamento:
                        "PIX",

                    created_at:
                        new Date().toISOString(),
                }
            ]);

        await carregar();
    }

    // =========================
    // FILTROS
    // =========================

    const contasFiltradas =
        useMemo(() => {

            return contas.filter((c) => {

                if (
                    filtro === "TODOS"
                ) {

                    return true;
                }

                return c.status === filtro;
            });

        }, [contas, filtro]);

    // =========================
    // KPIs
    // =========================

    const totalReceber =
        contasFiltradas.reduce(

            (acc, item) =>

                acc +
                Number(
                    item.saldo_restante ||
                    item.valor
                ),

            0
        );

    const totalAtrasado =
        contasFiltradas

            .filter(
                (c) =>
                    c.status ===
                    "ATRASADO"
            )

            .reduce(

                (acc, item) =>

                    acc +
                    Number(
                        item.saldo_restante ||
                        item.valor
                    ),

                0
            );

    const totalPago =
        contasFiltradas

            .filter(
                (c) =>
                    c.status ===
                    "PAGO"
            )

            .reduce(

                (acc, item) =>

                    acc +
                    Number(
                        item.valor_pago || 0
                    ),

                0
            );

    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <p className="text-xl">

                    Carregando financeiro...

                </p>

            </div>
        );
    }

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            {/* HEADER */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

                <div>

                    <h1 className="text-3xl md:text-4xl font-bold">

                        Contas a Receber

                    </h1>

                    <p className="text-gray-500 mt-2">

                        Gestão financeira e cobranças

                    </p>

                </div>

            </div>

            {/* KPIs */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <div className="bg-white p-6 rounded-3xl shadow-md">

                    <p className="text-gray-500 mb-2">

                        Total em aberto

                    </p>

                    <h2 className="text-3xl font-bold text-orange-500">

                        R$ {totalReceber.toFixed(2)}

                    </h2>

                </div>

                <div className="bg-white p-6 rounded-3xl shadow-md">

                    <p className="text-gray-500 mb-2">

                        Total atrasado

                    </p>

                    <h2 className="text-3xl font-bold text-red-600">

                        R$ {totalAtrasado.toFixed(2)}

                    </h2>

                </div>

                <div className="bg-white p-6 rounded-3xl shadow-md">

                    <p className="text-gray-500 mb-2">

                        Total recebido

                    </p>

                    <h2 className="text-3xl font-bold text-green-600">

                        R$ {totalPago.toFixed(2)}

                    </h2>

                </div>

            </div>

            {/* FILTROS */}

            <div className="bg-white p-4 rounded-3xl shadow-md mb-8">

                <div className="flex flex-col md:flex-row gap-4">

                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={busca}
                        onChange={(e) =>
                            setBusca(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded-xl flex-1"
                    />

                    <div className="flex flex-wrap gap-2">

                        <button
                            onClick={() =>
                                setFiltro("TODOS")
                            }
                            className={`px-4 py-2 rounded-xl text-white ${filtro === "TODOS"
                                ? "bg-black"
                                : "bg-gray-400"
                                }`}
                        >
                            Todos
                        </button>

                        <button
                            onClick={() =>
                                setFiltro("PENDENTE")
                            }
                            className={`px-4 py-2 rounded-xl text-white ${filtro === "PENDENTE"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                                }`}
                        >
                            Pendentes
                        </button>

                        <button
                            onClick={() =>
                                setFiltro("PARCIAL")
                            }
                            className={`px-4 py-2 rounded-xl text-white ${filtro === "PARCIAL"
                                ? "bg-blue-600"
                                : "bg-gray-400"
                                }`}
                        >
                            Parciais
                        </button>

                        <button
                            onClick={() =>
                                setFiltro("PAGO")
                            }
                            className={`px-4 py-2 rounded-xl text-white ${filtro === "PAGO"
                                ? "bg-green-600"
                                : "bg-gray-400"
                                }`}
                        >
                            Pagos
                        </button>

                        <button
                            onClick={() =>
                                setFiltro("ATRASADO")
                            }
                            className={`px-4 py-2 rounded-xl text-white ${filtro === "ATRASADO"
                                ? "bg-red-600"
                                : "bg-gray-400"
                                }`}
                        >
                            Atrasados
                        </button>

                    </div>

                </div>

            </div>

            {/* TABELA */}

            <div className="bg-white rounded-3xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1400px]">

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

                                    Pago

                                </th>

                                <th className="p-4 text-left">

                                    Saldo

                                </th>

                                <th className="p-4 text-left">

                                    Vencimento

                                </th>

                                <th className="p-4 text-left">

                                    Status

                                </th>

                                <th className="p-4 text-left">

                                    Ações

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {contasFiltradas.map((c) => (

                                <tr
                                    key={c.id}
                                    className="border-t"
                                >

                                    {/* CLIENTE */}

                                    <td className="p-4">

                                        <div>

                                            <p className="font-medium">

                                                {c.clientes?.nome}

                                            </p>

                                            <p className="text-sm text-gray-500">

                                                {c.clientes?.telefone}

                                            </p>

                                        </div>

                                    </td>

                                    {/* PARCELA */}

                                    <td className="p-4">

                                        {c.parcela}/
                                        {c.total_parcelas}

                                    </td>

                                    {/* VALOR */}

                                    <td className="p-4 font-medium">

                                        R$ {Number(
                                            c.valor
                                        ).toFixed(2)}

                                    </td>

                                    {/* PAGO */}

                                    <td className="p-4 text-green-600 font-medium">

                                        R$ {Number(
                                            c.valor_pago || 0
                                        ).toFixed(2)}

                                    </td>

                                    {/* SALDO */}

                                    <td className="p-4 text-orange-500 font-medium">

                                        R$ {Number(
                                            c.saldo_restante ||
                                            c.valor
                                        ).toFixed(2)}

                                    </td>

                                    {/* VENCIMENTO */}

                                    <td className="p-4">

                                        {new Date(
                                            c.data_vencimento
                                        ).toLocaleDateString(
                                            "pt-BR"
                                        )}

                                    </td>

                                    {/* STATUS */}

                                    <td className="p-4">

                                        {c.status ===
                                            "PAGO" && (

                                                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">

                                                    Pago

                                                </span>
                                            )}

                                        {c.status ===
                                            "PENDENTE" && (

                                                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs">

                                                    Pendente

                                                </span>
                                            )}

                                        {c.status ===
                                            "PARCIAL" && (

                                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">

                                                    Parcial

                                                </span>
                                            )}

                                        {c.status ===
                                            "ATRASADO" && (

                                                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs">

                                                    Atrasado

                                                </span>
                                            )}

                                    </td>

                                    {/* AÇÕES */}

                                    <td className="p-4">

                                        <div className="flex gap-2">

                                            {c.status !==
                                                "PAGO" && (

                                                    <button
                                                        onClick={() =>
                                                            receberPagamento(c)
                                                        }
                                                        className="bg-green-600 text-white px-4 py-2 rounded-xl"
                                                    >
                                                        Receber
                                                    </button>
                                                )}

                                            <a
                                                href={`https://wa.me/55${c.clientes?.telefone?.replace(/\D/g, "")}`}
                                                target="_blank"
                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                                            >
                                                Cobrar
                                            </a>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}