"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Cliente {
    id: string;
    nome: string;
}

interface Produto {
    id: string;
    nome: string;
    preco: number;
    estoque: number;
}

interface ItemVenda {
    produto_id: string;
    nome: string;
    quantidade: number;
    preco: number;
}

export default function VendasPage() {

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [itens, setItens] = useState<ItemVenda[]>([]);

    const [clienteId, setClienteId] = useState("");
    const [produtoId, setProdutoId] = useState("");
    const [quantidade, setQuantidade] = useState(1);

    const [desconto, setDesconto] = useState("");
    const [entrada, setEntrada] = useState("");

    const [parcelas, setParcelas] = useState(1);
    const [formaPagamento, setFormaPagamento] = useState("DINHEIRO");
    const [observacoes, setObservacoes] = useState("");

    const [loading, setLoading] = useState(false);

    // =====================================
    // FORMATAR MOEDA
    // =====================================

    function formatMoney(value: string) {

        const onlyNumbers = value.replace(/\D/g, "");

        return (Number(onlyNumbers) / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
        });
    }

    // =====================================
    // CARREGAR DADOS
    // =====================================

    async function carregarDados() {

        const { data: clientesData } = await supabase
            .from("clientes")
            .select("id, nome")
            .order("nome");

        const { data: produtosData } = await supabase
            .from("produtos")
            .select("id, nome, preco, estoque")
            .order("nome");

        setClientes(clientesData || []);
        setProdutos(produtosData || []);
    }

    useEffect(() => {
        carregarDados();
    }, []);

    // =====================================
    // ADICIONAR ITEM
    // =====================================

    function adicionarItem() {

        if (!produtoId) {
            alert("Selecione um produto");
            return;
        }

        const produto = produtos.find((p) => p.id === produtoId);

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
            (item) => item.produto_id === produto.id
        );

        if (itemExistente) {

            const novosItens = itens.map((item) => {

                if (item.produto_id === produto.id) {

                    return {
                        ...item,
                        quantidade: item.quantidade + quantidade,
                    };
                }

                return item;
            });

            setItens(novosItens);

        } else {

            setItens([
                ...itens,
                {
                    produto_id: produto.id,
                    nome: produto.nome,
                    quantidade,
                    preco: produto.preco,
                },
            ]);
        }

        setProdutoId("");
        setQuantidade(1);
    }

    // =====================================
    // REMOVER ITEM
    // =====================================

    function removerItem(produto_id: string) {

        setItens(
            itens.filter((item) => item.produto_id !== produto_id)
        );
    }

    // =====================================
    // TOTAL
    // =====================================

    const subtotal = itens.reduce((acc, item) => {
        return acc + (item.quantidade * item.preco);
    }, 0);

    const descontoValor =
        Number(desconto.replace(/\D/g, "")) / 100 || 0;

    const entradaValor =
        Number(entrada.replace(/\D/g, "")) / 100 || 0;

    const totalFinal = subtotal - descontoValor;

    const restante = totalFinal - entradaValor;

    // =====================================
    // FINALIZAR VENDA
    // =====================================

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

            // =====================================
            // CRIAR VENDA
            // =====================================

            const { data: venda, error: vendaError } = await supabase
                .from("vendas")
                .insert([
                    {
                        cliente_id: clienteId,
                        subtotal,
                        desconto: descontoValor,
                        entrada: entradaValor,
                        total: totalFinal,
                        parcelas,
                        forma_pagamento: formaPagamento,
                        observacoes,
                    },
                ])
                .select()
                .single();

            if (vendaError) {
                throw vendaError;
            }

            // =====================================
            // ITENS DA VENDA
            // =====================================

            const itensVenda = itens.map((item) => ({
                venda_id: venda.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco,
                subtotal: item.quantidade * item.preco,
            }));

            const { error: itensError } = await supabase
                .from("itens_venda")
                .insert(itensVenda);

            if (itensError) {
                throw itensError;
            }

            // =====================================
            // ATUALIZAR ESTOQUE
            // =====================================

            for (const item of itens) {

                const produto = produtos.find(
                    (p) => p.id === item.produto_id
                );

                if (!produto) continue;

                const novoEstoque =
                    produto.estoque - item.quantidade;

                const { error } = await supabase
                    .from("produtos")
                    .update({
                        estoque: novoEstoque,
                    })
                    .eq("id", item.produto_id);

                if (error) {
                    throw error;
                }
            }

            // =====================================
            // CONTAS A RECEBER
            // =====================================

            if (restante > 0) {

                const valorParcela = restante / parcelas;

                const contas = [];

                for (let i = 1; i <= parcelas; i++) {

                    const vencimento = new Date();

                    vencimento.setMonth(vencimento.getMonth() + i);

                    contas.push({
                        cliente_id: clienteId,
                        venda_id: venda.id,
                        valor: valorParcela,
                        valor_pago: 0,
                        saldo_restante: valorParcela,
                        parcela: i,
                        total_parcelas: parcelas,
                        data_vencimento: vencimento
                            .toISOString()
                            .split("T")[0],
                        status: "PENDENTE",
                        forma_pagamento: formaPagamento,
                    });
                }

                const { error } = await supabase
                    .from("contas_receber")
                    .insert(contas);

                if (error) {
                    throw error;
                }
            }

            // =====================================
            // LIMPAR
            // =====================================

            setItens([]);
            setClienteId("");
            setProdutoId("");
            setQuantidade(1);
            setDesconto("");
            setEntrada("");
            setParcelas(1);
            setObservacoes("");

            alert("Venda finalizada com sucesso");

        } catch (error: any) {

            console.error(error);

            alert(
                error.message || "Erro ao finalizar venda"
            );

        } finally {

            setLoading(false);
        }
    }

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Vendas
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-6">

                <div className="grid grid-cols-2 gap-4">

                    <select
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        className="border p-3 rounded-xl"
                    >
                        <option value="">
                            Selecione o cliente
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

                    <select
                        value={produtoId}
                        onChange={(e) => setProdutoId(e.target.value)}
                        className="border p-3 rounded-xl"
                    >
                        <option value="">
                            Selecione o produto
                        </option>

                        {produtos.map((produto) => (
                            <option
                                key={produto.id}
                                value={produto.id}
                            >
                                {produto.nome} — Estoque:
                                {produto.estoque}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={quantidade}
                        onChange={(e) =>
                            setQuantidade(Number(e.target.value))
                        }
                        placeholder="Quantidade"
                        className="border p-3 rounded-xl"
                    />

                    <button
                        onClick={adicionarItem}
                        className="bg-black text-white rounded-xl"
                    >
                        Adicionar Item
                    </button>

                </div>

            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">
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
                                Subtotal
                            </th>
                            <th className="p-3 text-left">
                                Ações
                            </th>
                        </tr>

                    </thead>

                    <tbody>

                        {itens.map((item) => (

                            <tr
                                key={item.produto_id}
                                className="border-b"
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
                                            removerItem(item.produto_id)
                                        }
                                        className="bg-red-600 text-white px-3 py-1 rounded-lg"
                                    >
                                        Remover
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md">

                <div className="grid grid-cols-2 gap-4">

                    <input
                        placeholder="Desconto"
                        value={desconto}
                        onChange={(e) =>
                            setDesconto(formatMoney(e.target.value))
                        }
                        className="border p-3 rounded-xl"
                    />

                    <input
                        placeholder="Entrada"
                        value={entrada}
                        onChange={(e) =>
                            setEntrada(formatMoney(e.target.value))
                        }
                        className="border p-3 rounded-xl"
                    />

                    <input
                        type="number"
                        min={1}
                        value={parcelas}
                        onChange={(e) =>
                            setParcelas(Number(e.target.value))
                        }
                        className="border p-3 rounded-xl"
                    />

                    <select
                        value={formaPagamento}
                        onChange={(e) =>
                            setFormaPagamento(e.target.value)
                        }
                        className="border p-3 rounded-xl"
                    >
                        <option value="DINHEIRO">
                            Dinheiro
                        </option>

                        <option value="PIX">
                            PIX
                        </option>

                        <option value="CARTAO">
                            Cartão
                        </option>

                        <option value="BOLETO">
                            Boleto
                        </option>
                    </select>

                </div>

                <textarea
                    placeholder="Observações"
                    value={observacoes}
                    onChange={(e) =>
                        setObservacoes(e.target.value)
                    }
                    className="border p-3 rounded-xl w-full mt-4"
                />

                <div className="mt-6 space-y-2 text-lg">

                    <p>
                        <strong>Subtotal:</strong> R${" "}
                        {subtotal.toFixed(2)}
                    </p>

                    <p>
                        <strong>Desconto:</strong> R${" "}
                        {descontoValor.toFixed(2)}
                    </p>

                    <p>
                        <strong>Total:</strong> R${" "}
                        {totalFinal.toFixed(2)}
                    </p>

                    <p>
                        <strong>Entrada:</strong> R${" "}
                        {entradaValor.toFixed(2)}
                    </p>

                    <p>
                        <strong>Restante:</strong> R${" "}
                        {restante.toFixed(2)}
                    </p>

                </div>

                <button
                    onClick={finalizarVenda}
                    disabled={loading}
                    className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl"
                >
                    {loading
                        ? "Finalizando..."
                        : "Finalizar Venda"}
                </button>

            </div>

        </div>
    );
}