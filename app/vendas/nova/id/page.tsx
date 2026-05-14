"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Plus,
    Search,
    Eye,
    XCircle,
    ShoppingCart,
    DollarSign,
    Clock3,
} from "lucide-react";

type Venda = {
    id: string;
    total: number;
    parcelas: number;
    forma_pagamento: string;
    status: string;
    created_at: string;
    clientes: {
        nome: string;
    } | null;
};

export default function VendasPage() {

    const [vendas, setVendas] =
        useState<Venda[]>([]);

    const [busca, setBusca] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    // =========================
    // CARREGAR VENDAS
    // =========================

    async function carregarVendas() {

        setLoading(true);

        const { data, error } =
            await supabase
                .from("vendas")
                .select(`
                    *,
                    clientes (
                        nome
                    )
                `)
                .order("created_at", {
                    ascending: false,
                });

        if (error) {

            console.error(error);

            alert(
                "Erro ao carregar vendas"
            );
        }

        setVendas(data || []);

        setLoading(false);
    }

    // =========================
    // CANCELAR VENDA
    // =========================

    async function cancelarVenda(
        vendaId: string
    ) {

        const confirmar =
            confirm(
                "Deseja cancelar esta venda?"
            );

        if (!confirmar) return;

        try {

            // =========================
            // BUSCAR ITENS
            // =========================

            const {
                data: itens,
                error: itensError,
            } = await supabase
                .from("itens_venda")
                .select(`
                    *,
                    produtos (
                        estoque
                    )
                `)
                .eq("venda_id", vendaId);

            if (itensError)
                throw itensError;

            // =========================
            // DEVOLVER ESTOQUE
            // =========================

            for (const item of itens || []) {

                const estoqueAtual =
                    item.produtos?.estoque || 0;

                const novoEstoque =
                    estoqueAtual +
                    item.quantidade;

                const {
                    error: estoqueError,
                } = await supabase
                    .from("produtos")
                    .update({
                        estoque: novoEstoque,
                    })
                    .eq(
                        "id",
                        item.produto_id
                    );

                if (estoqueError)
                    throw estoqueError;
            }

            // =========================
            // CANCELAR CONTAS
            // =========================

            const {
                error: contasError,
            } = await supabase
                .from("contas_receber")
                .update({
                    status: "Cancelado",
                })
                .eq("venda_id", vendaId);

            if (contasError)
                throw contasError;

            // =========================
            // CANCELAR VENDA
            // =========================

            const {
                error: vendaError,
            } = await supabase
                .from("vendas")
                .update({
                    status: "Cancelada",
                    cancelada_em:
                        new Date().toISOString(),
                })
                .eq("id", vendaId);

            if (vendaError)
                throw vendaError;

            alert(
                "Venda cancelada com sucesso"
            );

            carregarVendas();

        } catch (error: any) {

            console.error(error);

            alert(
                error.message ||
                "Erro ao cancelar venda"
            );
        }
    }

    // =========================
    // FILTRO
    // =========================

    const vendasFiltradas =
        useMemo(() => {

            return vendas.filter(
                (venda) => {

                    const termo =
                        busca.toLowerCase();

                    return (
                        venda.id
                            ?.toLowerCase()
                            .includes(termo) ||

                        venda.clientes?.nome
                            ?.toLowerCase()
                            .includes(termo) ||

                        venda.forma_pagamento
                            ?.toLowerCase()
                            .includes(termo)
                    );
                }
            );

        }, [vendas, busca]);

    // =========================
    // MÉTRICAS
    // =========================

    const totalVendas =
        vendas.reduce(
            (acc, venda) =>
                acc + Number(venda.total),
            0
        );

    const vendasConcluidas =
        vendas.filter(
            (venda) =>
                venda.status !==
                "Cancelada"
        ).length;

    const vendasCanceladas =
        vendas.filter(
            (venda) =>
                venda.status ===
                "Cancelada"
        ).length;

    // =========================
    // INIT
    // =========================

    useEffect(() => {

        carregarVendas();

    }, []);

    return (

        <div className="p-8 bg-gray-100 min-h-screen">

            {/* HEADER */}

            <div className="flex items-center justify-between mb-8">

                <div>

                    <h1 className="text-4xl font-bold">
                        Vendas
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Gerencie todas as vendas
                    </p>

                </div>

                <Link
                    href="/vendas/nova"
                    className="
                        bg-black
                        text-white
                        px-6
                        py-3
                        rounded-2xl
                        flex
                        items-center
                        gap-2
                        hover:opacity-90
                    "
                >

                    <Plus size={20} />

                    Nova Venda

                </Link>

            </div>

            {/* CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <div className="bg-white p-6 rounded-3xl shadow-sm">

                    <div className="flex justify-between items-center">

                        <div>

                            <p className="text-gray-500">
                                Total Vendido
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                R$ {totalVendas.toFixed(2)}
                            </h2>

                        </div>

                        <DollarSign size={40} />

                    </div>

                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm">

                    <div className="flex justify-between items-center">

                        <div>

                            <p className="text-gray-500">
                                Vendas Concluídas
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {vendasConcluidas}
                            </h2>

                        </div>

                        <ShoppingCart size={40} />

                    </div>

                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm">

                    <div className="flex justify-between items-center">

                        <div>

                            <p className="text-gray-500">
                                Canceladas
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {vendasCanceladas}
                            </h2>

                        </div>

                        <XCircle size={40} />

                    </div>

                </div>

            </div>

            {/* BUSCA */}

            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">

                <div className="flex items-center gap-3">

                    <Search size={20} />

                    <input
                        type="text"
                        placeholder="Buscar venda..."
                        value={busca}
                        onChange={(e) =>
                            setBusca(
                                e.target.value
                            )
                        }
                        className="
                            w-full
                            outline-none
                            bg-transparent
                        "
                    />

                </div>

            </div>

            {/* TABELA */}

            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-4 text-left">
                                Cliente
                            </th>

                            <th className="p-4 text-left">
                                Total
                            </th>

                            <th className="p-4 text-left">
                                Parcelas
                            </th>

                            <th className="p-4 text-left">
                                Forma Pgto
                            </th>

                            <th className="p-4 text-left">
                                Status
                            </th>

                            <th className="p-4 text-left">
                                Data
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
                                    className="
                                        p-10
                                        text-center
                                        text-gray-500
                                    "
                                >
                                    Carregando...
                                </td>

                            </tr>

                        ) : vendasFiltradas.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={7}
                                    className="
                                        p-10
                                        text-center
                                        text-gray-500
                                    "
                                >
                                    Nenhuma venda encontrada
                                </td>

                            </tr>

                        ) : (

                            vendasFiltradas.map(
                                (venda) => (

                                    <tr
                                        key={venda.id}
                                        className="
                                            border-t
                                            hover:bg-gray-50
                                        "
                                    >

                                        <td className="p-4">
                                            {
                                                venda
                                                    .clientes
                                                    ?.nome
                                            }
                                        </td>

                                        <td className="p-4 font-semibold">
                                            R${" "}
                                            {Number(
                                                venda.total
                                            ).toFixed(
                                                2
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {
                                                venda.parcelas
                                            }x
                                        </td>

                                        <td className="p-4">
                                            {
                                                venda.forma_pagamento
                                            }
                                        </td>

                                        <td className="p-4">

                                            {venda.status ===
                                                "Cancelada" ? (

                                                <span
                                                    className="
                                                        bg-red-100
                                                        text-red-700
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-sm
                                                    "
                                                >
                                                    Cancelada
                                                </span>

                                            ) : (

                                                <span
                                                    className="
                                                        bg-green-100
                                                        text-green-700
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-sm
                                                    "
                                                >
                                                    Concluída
                                                </span>

                                            )}

                                        </td>

                                        <td className="p-4">

                                            {new Date(
                                                venda.created_at
                                            ).toLocaleDateString(
                                                "pt-BR"
                                            )}

                                        </td>

                                        <td className="p-4">

                                            <div className="flex gap-2">

                                                <Link
                                                    href={`/vendas/${venda.id}`}
                                                    className="
                                                        bg-blue-600
                                                        text-white
                                                        px-4
                                                        py-2
                                                        rounded-xl
                                                        flex
                                                        items-center
                                                        gap-2
                                                    "
                                                >

                                                    <Eye size={16} />

                                                    Ver

                                                </Link>

                                                {venda.status !==
                                                    "Cancelada" && (

                                                        <button
                                                            onClick={() =>
                                                                cancelarVenda(
                                                                    venda.id
                                                                )
                                                            }
                                                            className="
                                                                bg-red-600
                                                                text-white
                                                                px-4
                                                                py-2
                                                                rounded-xl
                                                                flex
                                                                items-center
                                                                gap-2
                                                            "
                                                        >

                                                            <Clock3 size={16} />

                                                            Cancelar

                                                        </button>

                                                    )}

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}