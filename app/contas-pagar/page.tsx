"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

import {
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

type ContaPagar = {
    id: string;

    descricao: string;

    fornecedor: string;

    valor: number;

    data_vencimento: string;

    data_pagamento: string | null;

    status: string;

    forma_pagamento: string;

    observacoes: string;
};

export default function ContasPagarPage() {

    const [contas, setContas] =
        useState<ContaPagar[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [busca, setBusca] =
        useState("");

    const [form, setForm] = useState({
        descricao: "",
        fornecedor: "",
        valor: "",
        data_vencimento: "",
        forma_pagamento: "PIX",
        observacoes: "",
    });

    // =========================
    // FORMATAR MOEDA
    // =========================

    function formatCurrency(
        value: number
    ) {

        return value.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL",
            }
        );
    }

    // =========================
    // CARREGAR CONTAS
    // =========================

    async function carregarContas() {

        setLoading(true);

        const { data, error } =
            await supabase
                .from("contas_pagar")
                .select("*")
                .order(
                    "data_vencimento",
                    {
                        ascending: true,
                    }
                );

        if (error) {

            console.error(error);

            alert(error.message);

            setLoading(false);

            return;
        }

        setContas(data || []);

        setLoading(false);
    }

    // =========================
    // SALVAR CONTA
    // =========================

    async function salvarConta() {

        if (
            !form.descricao ||
            !form.valor ||
            !form.data_vencimento
        ) {

            alert(
                "Preencha os campos obrigatórios"
            );

            return;
        }

        const { error } =
            await supabase
                .from("contas_pagar")
                .insert([
                    {
                        descricao:
                            form.descricao,

                        fornecedor:
                            form.fornecedor,

                        valor: Number(
                            form.valor
                        ),

                        data_vencimento:
                            form.data_vencimento,

                        forma_pagamento:
                            form.forma_pagamento,

                        observacoes:
                            form.observacoes,

                        status: "Pendente",
                    },
                ]);

        if (error) {

            alert(error.message);

            return;
        }

        alert(
            "Conta lançada com sucesso"
        );

        setForm({
            descricao: "",
            fornecedor: "",
            valor: "",
            data_vencimento: "",
            forma_pagamento: "PIX",
            observacoes: "",
        });

        carregarContas();
    }

    // =========================
    // PAGAR CONTA
    // =========================

    async function pagarConta(
        conta: ContaPagar
    ) {

        const { error } =
            await supabase
                .from("contas_pagar")
                .update({
                    status: "Pago",

                    data_pagamento:
                        new Date()
                            .toISOString(),
                })
                .eq("id", conta.id);

        if (error) {

            alert(error.message);

            return;
        }

        alert("Conta paga");

        carregarContas();
    }

    // =========================
    // EXCLUIR CONTA
    // =========================

    async function excluirConta(
        id: string
    ) {

        const confirmar =
            confirm(
                "Deseja realmente excluir?"
            );

        if (!confirmar) return;

        const { error } =
            await supabase
                .from("contas_pagar")
                .delete()
                .eq("id", id);

        if (error) {

            alert(error.message);

            return;
        }

        carregarContas();
    }

    // =========================
    // FILTRO
    // =========================

    const contasFiltradas =
        useMemo(() => {

            return contas.filter(
                (conta) => {

                    const termo =
                        busca.toLowerCase();

                    return (
                        conta.descricao
                            ?.toLowerCase()
                            .includes(
                                termo
                            ) ||

                        conta.fornecedor
                            ?.toLowerCase()
                            .includes(
                                termo
                            )
                    );
                }
            );

        }, [contas, busca]);

    // =========================
    // TOTALIZADORES
    // =========================

    const totalPendente =
        contas
            .filter(
                (c) =>
                    c.status ===
                    "Pendente"
            )
            .reduce(
                (acc, conta) =>
                    acc +
                    Number(conta.valor),
                0
            );

    const totalPago =
        contas
            .filter(
                (c) =>
                    c.status === "Pago"
            )
            .reduce(
                (acc, conta) =>
                    acc +
                    Number(conta.valor),
                0
            );

    // =========================
    // EFFECT
    // =========================

    useEffect(() => {

        carregarContas();

    }, []);

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            {/* HEADER */}

            <div className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
                mb-8
            ">

                <div>

                    <h1 className="
                        text-2xl
                        md:text-4xl
                        font-bold
                    ">

                        Contas a Pagar

                    </h1>

                    <p className="text-gray-500">

                        Controle financeiro de despesas

                    </p>

                </div>

            </div>

            {/* CARDS */}

            <div className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
                mb-8
            ">

                <div className="
                    bg-white
                    p-6
                    rounded-2xl
                    shadow-md
                ">

                    <div className="
                        flex
                        items-center
                        justify-between
                    ">

                        <div>

                            <p className="text-gray-500">
                                Total Pendente
                            </p>

                            <h2 className="
                                text-3xl
                                font-bold
                                text-red-600
                            ">

                                {formatCurrency(
                                    totalPendente
                                )}

                            </h2>

                        </div>

                        <AlertCircle
                            size={40}
                            className="text-red-600"
                        />

                    </div>

                </div>

                <div className="
                    bg-white
                    p-6
                    rounded-2xl
                    shadow-md
                ">

                    <div className="
                        flex
                        items-center
                        justify-between
                    ">

                        <div>

                            <p className="text-gray-500">
                                Total Pago
                            </p>

                            <h2 className="
                                text-3xl
                                font-bold
                                text-green-600
                            ">

                                {formatCurrency(
                                    totalPago
                                )}

                            </h2>

                        </div>

                        <CheckCircle2
                            size={40}
                            className="text-green-600"
                        />

                    </div>

                </div>

            </div>

            {/* FORM */}

            <div className="
                bg-white
                p-6
                rounded-2xl
                shadow-md
                mb-8
            ">

                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-4
                ">

                    <input
                        placeholder="Descrição"
                        value={form.descricao}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                descricao:
                                    e.target.value,
                            })
                        }
                        className="
                            border
                            p-3
                            rounded-xl
                        "
                    />

                    <input
                        placeholder="Fornecedor"
                        value={form.fornecedor}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                fornecedor:
                                    e.target.value,
                            })
                        }
                        className="
                            border
                            p-3
                            rounded-xl
                        "
                    />

                    <input
                        type="number"
                        placeholder="Valor"
                        value={form.valor}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                valor:
                                    e.target.value,
                            })
                        }
                        className="
                            border
                            p-3
                            rounded-xl
                        "
                    />

                    <input
                        type="date"
                        value={
                            form.data_vencimento
                        }
                        onChange={(e) =>
                            setForm({
                                ...form,
                                data_vencimento:
                                    e.target.value,
                            })
                        }
                        className="
                            border
                            p-3
                            rounded-xl
                        "
                    />

                    <select
                        value={
                            form.forma_pagamento
                        }
                        onChange={(e) =>
                            setForm({
                                ...form,
                                forma_pagamento:
                                    e.target.value,
                            })
                        }
                        className="
                            border
                            p-3
                            rounded-xl
                        "
                    >

                        <option>
                            PIX
                        </option>

                        <option>
                            Boleto
                        </option>

                        <option>
                            Cartão
                        </option>

                        <option>
                            Dinheiro
                        </option>

                    </select>

                </div>

                <textarea
                    placeholder="Observações"
                    value={form.observacoes}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            observacoes:
                                e.target.value,
                        })
                    }
                    className="
                        w-full
                        border
                        p-3
                        rounded-xl
                        mt-4
                    "
                />

                <button
                    onClick={salvarConta}
                    className="
                        mt-6
                        bg-black
                        text-white
                        px-6
                        py-3
                        rounded-xl
                        flex
                        items-center
                        gap-2
                    "
                >

                    <Plus size={18} />

                    Nova Conta

                </button>

            </div>

            {/* BUSCA */}

            <div className="mb-6">

                <input
                    placeholder="Buscar conta..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(
                            e.target.value
                        )
                    }
                    className="
                        w-full
                        border
                        p-4
                        rounded-2xl
                    "
                />

            </div>

            {/* TABELA */}

            <div className="
                bg-white
                rounded-2xl
                shadow-md
                overflow-hidden
            ">

                <div className="overflow-x-auto">

                    <table className="
                        w-full
                        min-w-[1000px]
                    ">

                        <thead className="
                            bg-gray-100
                        ">

                            <tr>

                                <th className="
                                    p-4
                                    text-left
                                ">
                                    Descrição
                                </th>

                                <th className="
                                    p-4
                                    text-left
                                ">
                                    Fornecedor
                                </th>

                                <th className="
                                    p-4
                                    text-left
                                ">
                                    Valor
                                </th>

                                <th className="
                                    p-4
                                    text-left
                                ">
                                    Vencimento
                                </th>

                                <th className="
                                    p-4
                                    text-left
                                ">
                                    Status
                                </th>

                                <th className="
                                    p-4
                                    text-left
                                ">
                                    Ações
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan={6}
                                        className="
                                            p-10
                                            text-center
                                        "
                                    >

                                        Carregando...

                                    </td>

                                </tr>

                            ) : contasFiltradas.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={6}
                                        className="
                                            p-10
                                            text-center
                                            text-gray-500
                                        "
                                    >

                                        Nenhuma conta encontrada

                                    </td>

                                </tr>

                            ) : (

                                contasFiltradas.map(
                                    (conta) => (

                                        <tr
                                            key={
                                                conta.id
                                            }
                                            className="
                                                border-t
                                            "
                                        >

                                            <td className="
                                                p-4
                                            ">
                                                {
                                                    conta.descricao
                                                }
                                            </td>

                                            <td className="
                                                p-4
                                            ">
                                                {
                                                    conta.fornecedor
                                                }
                                            </td>

                                            <td className="
                                                p-4
                                                font-semibold
                                            ">
                                                {formatCurrency(
                                                    Number(
                                                        conta.valor
                                                    )
                                                )}
                                            </td>

                                            <td className="
                                                p-4
                                            ">

                                                {new Date(
                                                    conta.data_vencimento
                                                ).toLocaleDateString(
                                                    "pt-BR"
                                                )}

                                            </td>

                                            <td className="
                                                p-4
                                            ">

                                                {conta.status ===
                                                    "Pago" ? (

                                                    <span className="
                                                        bg-green-600
                                                        text-white
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                    ">

                                                        Pago

                                                    </span>

                                                ) : (

                                                    <span className="
                                                        bg-red-600
                                                        text-white
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                    ">

                                                        Pendente

                                                    </span>

                                                )}

                                            </td>

                                            <td className="
                                                p-4
                                                flex
                                                gap-2
                                            ">

                                                {conta.status !==
                                                    "Pago" && (

                                                        <button
                                                            onClick={() =>
                                                                pagarConta(
                                                                    conta
                                                                )
                                                            }
                                                            className="
                                                            bg-green-600
                                                            text-white
                                                            px-4
                                                            py-2
                                                            rounded-lg
                                                        "
                                                        >

                                                            Pagar

                                                        </button>

                                                    )}

                                                <button
                                                    onClick={() =>
                                                        excluirConta(
                                                            conta.id
                                                        )
                                                    }
                                                    className="
                                                        bg-red-600
                                                        text-white
                                                        px-4
                                                        py-2
                                                        rounded-lg
                                                    "
                                                >

                                                    <Trash2
                                                        size={16}
                                                    />

                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}