"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cliente = {
    id: string;
    nome: string;
};

type Produto = {
    id: string;
    nome: string;
    preco: number;
    estoque: number;
};

type ItemVenda = {
    id: string;
    nome: string;
    preco: number;
    estoque: number;
    quantidade: number;
};

export default function VendasPage() {

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    const [clienteId, setClienteId] = useState("");

    const [produtoSelecionado, setProdutoSelecionado] = useState("");

    const [quantidade, setQuantidade] = useState(1);

    const [itens, setItens] = useState<ItemVenda[]>([]);

    const [desconto, setDesconto] = useState(0);

    const [entrada, setEntrada] = useState(0);

    const [parcelas, setParcelas] = useState(1);

    const [formaPagamento, setFormaPagamento] = useState("PIX");

    const [observacoes, setObservacoes] = useState("");

    const [primeiroVencimento, setPrimeiroVencimento] = useState("");

    const [loading, setLoading] = useState(false);

    // =========================
    // CARREGAR CLIENTES
    // =========================

    async function carregarClientes() {

        const { data } = await supabase
            .from("clientes")
            .select("*")
            .order("nome");

        setClientes(data || []);
    }

    // =========================
    // CARREGAR PRODUTOS
    // =========================

    async function carregarProdutos() {

        const { data } = await supabase
            .from("produtos")
            .select("*")
            .order("nome");

        setProdutos(data || []);
    }

    useEffect(() => {

        carregarClientes();

        carregarProdutos();

    }, []);

    // =========================
    // ADICIONAR ITEM
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
            (item) => item.id === produto.id
        );

        if (itemExistente) {

            const novosItens = itens.map((item) => {

                if (item.id === produto.id) {

                    const novaQuantidade =
                        item.quantidade + quantidade;

                    if (novaQuantidade > produto.estoque) {

                        alert("Estoque insuficiente");

                        return item;
                    }

                    return {
                        ...item,
                        quantidade: novaQuantidade,
                    };
                }

                return item;
            });

            setItens(novosItens);

        } else {

            setItens([
                ...itens,
                {
                    id: produto.id,
                    nome: produto.nome,
                    preco: Number(produto.preco),
                    estoque: produto.estoque,
                    quantidade,
                },
            ]);
        }

        setProdutoSelecionado("");

        setQuantidade(1);
    }

    // =========================
    // REMOVER ITEM
    // =========================

    function removerItem(id: string) {

        setItens(
            itens.filter((item) => item.id !== id)
        );
    }

    // =========================
    // TOTAIS
    // =========================

    const subtotal = useMemo(() => {

        return itens.reduce((acc, item) => {

            return acc + (
                item.preco * item.quantidade
            );

        }, 0);

    }, [itens]);

    const total = useMemo(() => {

        return subtotal - desconto;

    }, [subtotal, desconto]);

    const saldoRestante = useMemo(() => {

        return total - entrada;

    }, [total, entrada]);

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

                alert("Adicione produtos");

                return;
            }

            // =========================
            // CRIAR VENDA
            // =========================

            const { data: venda, error: vendaError } =
                await supabase
                    .from("vendas")
                    .insert([
                        {
                            cliente_id: clienteId,
                            subtotal,
                            desconto,
                            total,
                            entrada,
                            saldo_restante: saldoRestante,
                            parcelas,
                            forma_pagamento: formaPagamento,
                            observacoes,
                            primeiro_vencimento:
                                primeiroVencimento,
                        },
                    ])
                    .select()
                    .single();

            if (vendaError) {

                throw vendaError;
            }

            // =========================
            // ITENS VENDA
            // =========================

            for (const item of itens) {

                const valorTotal =
                    item.preco * item.quantidade;

                const { error: itemError } =
                    await supabase
                        .from("itens_venda")
                        .insert([
                            {
                                venda_id: venda.id,
                                produto_id: item.id,
                                quantidade: item.quantidade,
                                valor_unitario: item.preco,
                                valor_total: valorTotal,
                            },
                        ]);

                if (itemError) {

                    throw itemError;
                }

                // =========================
                // BAIXAR ESTOQUE
                // =========================

                const novoEstoque =
                    item.estoque - item.quantidade;

                const { error: estoqueError } =
                    await supabase
                        .from("produtos")
                        .update({
                            estoque: novoEstoque,
                        })
                        .eq("id", item.id);

                if (estoqueError) {

                    throw estoqueError;
                }
            }

            // =========================
            // CONTAS A RECEBER
            // =========================

            if (saldoRestante > 0) {

                const valorParcela =
                    saldoRestante / parcelas;

                for (
                    let i = 1;
                    i <= parcelas;
                    i++
                ) {

                    const vencimento =
                        new Date(primeiroVencimento);

                    vencimento.setMonth(
                        vencimento.getMonth() + (i - 1)
                    );

                    const { error: contaError } =
                        await supabase
                            .from("contas_receber")
                            .insert([
                                {
                                    cliente_id: clienteId,
                                    venda_id: venda.id,
                                    valor: valorParcela,
                                    valor_pago: 0,
                                    saldo_restante:
                                        valorParcela,
                                    parcela: i,
                                    total_parcelas:
                                        parcelas,
                                    data_vencimento:
                                        vencimento
                                            .toISOString(),
                                    status: "Pendente",
                                    forma_pagamento:
                                        formaPagamento,
                                },
                            ]);

                    if (contaError) {

                        throw contaError;
                    }
                }
            }

            alert("Venda finalizada com sucesso");

            // =========================
            // RESET
            // =========================

            setClienteId("");

            setItens([]);

            setDesconto(0);

            setEntrada(0);

            setParcelas(1);

            setFormaPagamento("PIX");

            setObservacoes("");

            setPrimeiroVencimento("");

        } catch (error: any) {

            console.error(error);

            alert(
                error.message ||
                "Erro ao finalizar venda"
            );

        } finally {

            setLoading(false);
        }
    }

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Nova Venda
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md">

                {/* CLIENTE */}

                <div className="mb-6">

                    <label className="block mb-2 font-semibold">
                        Cliente
                    </label>

                    <select
                        value={clienteId}
                        onChange={(e) =>
                            setClienteId(e.target.value)
                        }
                        className="w-full border p-3 rounded-xl"
                    >

                        <option value="">
                            Selecione
                        </option>

                        {clientes.map((cliente) => (

                            <option
                                key={cliente.id}
                                value={cliente.id}
                            >
                                {cliente.nome}
                            </option>

                        ))}

                    </select>

                </div>

                {/* PRODUTOS */}

                <div className="grid grid-cols-3 gap-4 mb-6">

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

                        {produtos.map((produto) => (

                            <option
                                key={produto.id}
                                value={produto.id}
                            >
                                {produto.nome} - Estoque:
                                {" "}
                                {produto.estoque}
                            </option>

                        ))}

                    </select>

                    <input
                        type="number"
                        placeholder="Quantidade"
                        value={quantidade}
                        onChange={(e) =>
                            setQuantidade(
                                Number(e.target.value)
                            )
                        }
                        className="border p-3 rounded-xl"
                    />

                    <button
                        onClick={adicionarItem}
                        className="bg-black text-white rounded-xl"
                    >
                        Adicionar
                    </button>

                </div>

                {/* ITENS */}

                <div className="mb-6">

                    <table className="w-full">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="p-3 text-left">
                                    Produto
                                </th>

                                <th className="p-3 text-left">
                                    Quantidade
                                </th>

                                <th className="p-3 text-left">
                                    Preço
                                </th>

                                <th className="p-3 text-left">
                                    Total
                                </th>

                                <th className="p-3 text-left">
                                    Ações
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {itens.map((item) => (

                                <tr
                                    key={item.id}
                                    className="border-t"
                                >

                                    <td className="p-3">
                                        {item.nome}
                                    </td>

                                    <td className="p-3">
                                        {item.quantidade}
                                    </td>

                                    <td className="p-3">
                                        R$ {item.preco.toFixed(2)}
                                    </td>

                                    <td className="p-3">
                                        R$ {(item.preco * item.quantidade).toFixed(2)}
                                    </td>

                                    <td className="p-3">

                                        <button
                                            onClick={() =>
                                                removerItem(item.id)
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

                {/* FINANCEIRO */}

                <div className="grid grid-cols-2 gap-4 mb-6">

                    <input
                        type="number"
                        placeholder="Desconto"
                        value={desconto}
                        onChange={(e) =>
                            setDesconto(
                                Number(e.target.value)
                            )
                        }
                        className="border p-3 rounded-xl"
                    />

                    <input
                        type="number"
                        placeholder="Entrada"
                        value={entrada}
                        onChange={(e) =>
                            setEntrada(
                                Number(e.target.value)
                            )
                        }
                        className="border p-3 rounded-xl"
                    />

                    <input
                        type="number"
                        placeholder="Parcelas"
                        value={parcelas}
                        onChange={(e) =>
                            setParcelas(
                                Number(e.target.value)
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

                <div className="mb-6">

                    <select
                        value={formaPagamento}
                        onChange={(e) =>
                            setFormaPagamento(
                                e.target.value
                            )
                        }
                        className="w-full border p-3 rounded-xl"
                    >

                        <option>
                            PIX
                        </option>

                        <option>
                            Cartão
                        </option>

                        <option>
                            Dinheiro
                        </option>

                        <option>
                            Boleto
                        </option>

                    </select>

                </div>

                <div className="mb-6">

                    <textarea
                        placeholder="Observações"
                        value={observacoes}
                        onChange={(e) =>
                            setObservacoes(
                                e.target.value
                            )
                        }
                        className="w-full border p-3 rounded-xl"
                    />

                </div>

                {/* RESUMO */}

                <div className="bg-gray-100 p-6 rounded-2xl mb-6">

                    <div className="flex justify-between mb-2">
                        <span>Subtotal</span>
                        <strong>
                            R$ {subtotal.toFixed(2)}
                        </strong>
                    </div>

                    <div className="flex justify-between mb-2">
                        <span>Desconto</span>
                        <strong>
                            R$ {desconto.toFixed(2)}
                        </strong>
                    </div>

                    <div className="flex justify-between mb-2">
                        <span>Total</span>
                        <strong>
                            R$ {total.toFixed(2)}
                        </strong>
                    </div>

                    <div className="flex justify-between">
                        <span>Saldo Restante</span>
                        <strong>
                            R$ {saldoRestante.toFixed(2)}
                        </strong>
                    </div>

                </div>

                <button
                    onClick={finalizarVenda}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl text-lg font-bold"
                >
                    {loading
                        ? "Finalizando..."
                        : "Finalizar Venda"}
                </button>

            </div>

        </div>
    );
}