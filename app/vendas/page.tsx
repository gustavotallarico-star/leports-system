"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verificarAuth } from "@/lib/protect";

interface Cliente {
    id: string;
    nome: string;
    telefone?: string;
}

interface Produto {
    id: string;
    nome: string;
    preco: number;
    estoque: number;
}

interface ItemVenda {
    produto_id: string;
    produto_nome: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
}

export default function VendasPage() {

    const router = useRouter();

    const [clientes, setClientes] =
        useState<Cliente[]>([]);

    const [produtos, setProdutos] =
        useState<Produto[]>([]);

    const [itens, setItens] =
        useState<ItemVenda[]>([]);

    const [loading, setLoading] =
        useState(false);

    // =========================
    // FORM
    // =========================

    const [clienteId, setClienteId] =
        useState("");

    const [formaPagamento,
        setFormaPagamento] =
        useState("PIX");

    const [parcelas,
        setParcelas] =
        useState(1);

    const [entrada,
        setEntrada] =
        useState(0);

    const [desconto,
        setDesconto] =
        useState(0);

    const [primeiroVencimento,
        setPrimeiroVencimento] =
        useState(
            new Date()
                .toISOString()
                .split("T")[0]
        );

    const [observacoes,
        setObservacoes] =
        useState("");

    // =========================
    // ITEM TEMP
    // =========================

    const [produtoSelecionado,
        setProdutoSelecionado] =
        useState("");

    const [quantidade,
        setQuantidade] =
        useState(1);

    // =========================
    // INIT
    // =========================

    useEffect(() => {

        verificarAuth(router);

        carregarDados();

    }, [router]);

    async function carregarDados() {

        const { data: clientesData } =
            await supabase
                .from("clientes")
                .select("id, nome, telefone")
                .order("nome");

        const { data: produtosData } =
            await supabase
                .from("produtos")
                .select("id, nome, preco, estoque")
                .gt("estoque", 0)
                .order("nome");

        setClientes(clientesData || []);

        setProdutos(produtosData || []);
    }

    // =========================
    // ADD ITEM
    // =========================

    function adicionarItem() {

        if (!produtoSelecionado) {

            alert("Selecione um produto");

            return;
        }

        const produto = produtos.find(
            (p) => p.id === produtoSelecionado
        );

        if (!produto) return;

        if (quantidade <= 0) {

            alert("Quantidade inválida");

            return;
        }

        if (quantidade > produto.estoque) {

            alert("Estoque insuficiente");

            return;
        }

        const itemExistente = itens.find(
            (i) => i.produto_id === produto.id
        );

        if (itemExistente) {

            const novosItens = itens.map((i) => {

                if (i.produto_id === produto.id) {

                    const novaQuantidade =
                        i.quantidade + quantidade;

                    return {
                        ...i,
                        quantidade: novaQuantidade,
                        subtotal:
                            novaQuantidade *
                            i.valor_unitario,
                    };
                }

                return i;
            });

            setItens(novosItens);

        } else {

            const novoItem: ItemVenda = {

                produto_id: produto.id,

                produto_nome: produto.nome,

                quantidade,

                valor_unitario:
                    Number(produto.preco),

                subtotal:
                    quantidade *
                    Number(produto.preco),
            };

            setItens([
                ...itens,
                novoItem,
            ]);
        }

        setProdutoSelecionado("");

        setQuantidade(1);
    }

    // =========================
    // REMOVE ITEM
    // =========================

    function removerItem(index: number) {

        const novosItens =
            itens.filter(
                (_, i) => i !== index
            );

        setItens(novosItens);
    }

    // =========================
    // TOTALS
    // =========================

    const subtotal = useMemo(() => {

        return itens.reduce(
            (acc, item) =>
                acc + item.subtotal,
            0
        );

    }, [itens]);

    const totalFinal = useMemo(() => {

        return (
            subtotal -
            desconto -
            entrada
        );

    }, [subtotal, desconto, entrada]);

    const valorParcela = useMemo(() => {

        if (parcelas <= 0) return 0;

        return totalFinal / parcelas;

    }, [totalFinal, parcelas]);

    // =========================
    // FINALIZAR VENDA
    // =========================

    async function finalizarVenda() {

        try {

            setLoading(true);

            if (!clienteId) {

                alert("Selecione um cliente");

                return;
            }

            if (itens.length === 0) {

                alert("Adicione itens");

                return;
            }

            // =========================
            // CRIA VENDA
            // =========================

            const { data: venda,
                error: vendaError } =
                await supabase
                    .from("vendas")
                    .insert([
                        {
                            cliente_id:
                                clienteId,

                            subtotal,

                            desconto,

                            entrada,

                            valor_total:
                                subtotal - desconto,

                            valor_restante:
                                totalFinal,

                            forma_pagamento:
                                formaPagamento,

                            parcelas,

                            status:
                                parcelas > 1
                                    ? "PENDENTE"
                                    : "PAGO",

                            observacoes,
                        },
                    ])
                    .select()
                    .single();

            if (vendaError)
                throw vendaError;

            // =========================
            // INSERE ITENS
            // =========================

            const itensVenda =
                itens.map((item) => ({

                    venda_id:
                        venda.id,

                    produto_id:
                        item.produto_id,

                    produto_nome:
                        item.produto_nome,

                    quantidade:
                        item.quantidade,

                    valor_unitario:
                        item.valor_unitario,

                    subtotal:
                        item.subtotal,
                }));

            const { error: itensError } =
                await supabase
                    .from("vendas_itens")
                    .insert(itensVenda);

            if (itensError)
                throw itensError;

            // =========================
            // BAIXA ESTOQUE
            // =========================

            for (const item of itens) {

                const produto = produtos.find(
                    (p) =>
                        p.id ===
                        item.produto_id
                );

                if (!produto) continue;

                const novoEstoque =
                    produto.estoque -
                    item.quantidade;

                await supabase
                    .from("produtos")
                    .update({
                        estoque:
                            novoEstoque,
                    })
                    .eq(
                        "id",
                        item.produto_id
                    );
            }

            // =========================
            // ENTRADA
            // =========================

            if (entrada > 0) {

                await supabase
                    .from("recebimentos")
                    .insert([
                        {
                            venda_id:
                                venda.id,

                            cliente_id:
                                clienteId,

                            valor:
                                entrada,

                            forma_pagamento:
                                "PIX",
                        },
                    ]);
            }

            // =========================
            // GERA PARCELAS
            // =========================

            if (totalFinal > 0) {

                const parcelasInsert = [];

                for (
                    let i = 1;
                    i <= parcelas;
                    i++
                ) {

                    const vencimento =
                        new Date(
                            primeiroVencimento
                        );

                    vencimento.setMonth(
                        vencimento.getMonth() +
                        (i - 1)
                    );

                    parcelasInsert.push({

                        venda_id:
                            venda.id,

                        cliente_id:
                            clienteId,

                        valor:
                            valorParcela,

                        valor_pago: 0,

                        saldo_restante:
                            valorParcela,

                        parcela: i,

                        total_parcelas:
                            parcelas,

                        data_vencimento:
                            vencimento
                                .toISOString()
                                .split("T")[0],

                        status:
                            "PENDENTE",
                    });
                }

                await supabase
                    .from("contas_receber")
                    .insert(parcelasInsert);
            }

            // =========================
            // RESET
            // =========================

            setItens([]);

            setClienteId("");

            setEntrada(0);

            setDesconto(0);

            setParcelas(1);

            setObservacoes("");

            alert("Venda finalizada");

        } catch (error) {

            console.log(error);

            alert("Erro ao finalizar venda");

        } finally {

            setLoading(false);
        }
    }

    return (

        <div className="min-h-screen bg-gray-100 p-4 md:p-8">

            <div className="flex items-center justify-between mb-8">

                <div>

                    <h1 className="text-3xl md:text-4xl font-bold">
                        Nova Venda
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Cadastro de vendas e geração automática de parcelas
                    </p>

                </div>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ESQUERDA */}

                <div className="xl:col-span-2 space-y-6">

                    {/* DADOS VENDA */}

                    <div className="bg-white rounded-3xl shadow-md p-6">

                        <h2 className="text-xl font-bold mb-6">
                            Dados da venda
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <select
                                value={clienteId}
                                onChange={(e) =>
                                    setClienteId(
                                        e.target.value
                                    )
                                }
                                className="border p-3 rounded-xl"
                            >

                                <option value="">
                                    Selecione o cliente
                                </option>

                                {clientes.map((c) => (

                                    <option
                                        key={c.id}
                                        value={c.id}
                                    >
                                        {c.nome}
                                    </option>

                                ))}

                            </select>

                            <select
                                value={formaPagamento}
                                onChange={(e) =>
                                    setFormaPagamento(
                                        e.target.value
                                    )
                                }
                                className="border p-3 rounded-xl"
                            >

                                <option value="PIX">
                                    PIX
                                </option>

                                <option value="DINHEIRO">
                                    Dinheiro
                                </option>

                                <option value="BOLETO">
                                    Boleto
                                </option>

                            </select>

                            <input
                                type="number"
                                placeholder="Entrada"
                                value={entrada}
                                onChange={(e) =>
                                    setEntrada(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="border p-3 rounded-xl"
                            />

                            <input
                                type="number"
                                placeholder="Desconto"
                                value={desconto}
                                onChange={(e) =>
                                    setDesconto(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="border p-3 rounded-xl"
                            />

                            <input
                                type="number"
                                placeholder="Parcelas"
                                min={1}
                                value={parcelas}
                                onChange={(e) =>
                                    setParcelas(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="border p-3 rounded-xl"
                            />

                            <input
                                type="date"
                                value={primeiroVencimento}
                                onChange={(e) =>
                                    setPrimeiroVencimento(
                                        e.target.value
                                    )
                                }
                                className="border p-3 rounded-xl"
                            />

                        </div>

                        <textarea
                            placeholder="Observações"
                            value={observacoes}
                            onChange={(e) =>
                                setObservacoes(
                                    e.target.value
                                )
                            }
                            className="border p-3 rounded-xl w-full mt-4 h-28"
                        />

                    </div>

                    {/* ITENS */}

                    <div className="bg-white rounded-3xl shadow-md p-6">

                        <h2 className="text-xl font-bold mb-6">
                            Itens da venda
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                            <select
                                value={produtoSelecionado}
                                onChange={(e) =>
                                    setProdutoSelecionado(
                                        e.target.value
                                    )
                                }
                                className="border p-3 rounded-xl"
                            >

                                <option value="">
                                    Produto
                                </option>

                                {produtos.map((p) => (

                                    <option
                                        key={p.id}
                                        value={p.id}
                                    >
                                        {p.nome} | Estoque: {p.estoque}
                                    </option>

                                ))}

                            </select>

                            <input
                                type="number"
                                min={1}
                                value={quantidade}
                                onChange={(e) =>
                                    setQuantidade(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="border p-3 rounded-xl"
                            />

                            <button
                                onClick={adicionarItem}
                                className="bg-black text-white rounded-xl px-4 py-3"
                            >
                                Adicionar
                            </button>

                        </div>

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[800px]">

                                <thead className="bg-gray-100">

                                    <tr>

                                        <th className="p-4 text-left">
                                            Produto
                                        </th>

                                        <th className="p-4 text-left">
                                            Quantidade
                                        </th>

                                        <th className="p-4 text-left">
                                            Valor Unitário
                                        </th>

                                        <th className="p-4 text-left">
                                            Subtotal
                                        </th>

                                        <th className="p-4 text-left">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {itens.map((item, index) => (

                                        <tr
                                            key={index}
                                            className="border-t"
                                        >

                                            <td className="p-4">
                                                {item.produto_nome}
                                            </td>

                                            <td className="p-4">
                                                {item.quantidade}
                                            </td>

                                            <td className="p-4">
                                                R$ {item.valor_unitario.toFixed(2)}
                                            </td>

                                            <td className="p-4 font-bold">
                                                R$ {item.subtotal.toFixed(2)}
                                            </td>

                                            <td className="p-4">

                                                <button
                                                    onClick={() =>
                                                        removerItem(index)
                                                    }
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Remover
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

                {/* RESUMO */}

                <div>

                    <div className="bg-white rounded-3xl shadow-md p-6 sticky top-4">

                        <h2 className="text-2xl font-bold mb-6">
                            Resumo da venda
                        </h2>

                        <div className="space-y-4">

                            <div className="flex justify-between">

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    R$ {subtotal.toFixed(2)}
                                </strong>

                            </div>

                            <div className="flex justify-between">

                                <span>
                                    Desconto
                                </span>

                                <strong>
                                    R$ {desconto.toFixed(2)}
                                </strong>

                            </div>

                            <div className="flex justify-between">

                                <span>
                                    Entrada
                                </span>

                                <strong>
                                    R$ {entrada.toFixed(2)}
                                </strong>

                            </div>

                            <div className="border-t pt-4 flex justify-between text-xl font-bold">

                                <span>
                                    Total restante
                                </span>

                                <span>
                                    R$ {totalFinal.toFixed(2)}
                                </span>

                            </div>

                            <div className="bg-gray-100 rounded-2xl p-4 mt-4">

                                <p className="text-sm text-gray-500 mb-2">
                                    Parcelamento
                                </p>

                                <p className="text-lg font-bold">
                                    {parcelas}x de
                                    R$ {valorParcela.toFixed(2)}
                                </p>

                            </div>

                            <button
                                onClick={finalizarVenda}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg mt-6"
                            >
                                {loading
                                    ? "Finalizando..."
                                    : "Finalizar venda"}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
