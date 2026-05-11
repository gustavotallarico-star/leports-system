"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function VendasPage() {

    const [clientes, setClientes] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [vendas, setVendas] = useState<any[]>([]);

    const [clienteId, setClienteId] = useState("");
    const [produtoId, setProdutoId] = useState("");

    const [quantidade, setQuantidade] = useState(1);

    const [formaPagamento, setFormaPagamento] =
        useState("pix");

    const [parcelado, setParcelado] =
        useState("nao");

    const [parcelas, setParcelas] =
        useState(1);

    const [entrada, setEntrada] =
        useState(0);

    const [primeiroVencimento, setPrimeiroVencimento] =
        useState("");

    async function carregarDados() {

        const { data: clientesData } =
            await supabase
                .from("clientes")
                .select("*");

        const { data: produtosData } =
            await supabase
                .from("produtos")
                .select("*");

        const { data: vendasData } =
            await supabase
                .from("vendas")
                .select(`
                    *,
                    clientes(nome),
                    produtos(nome)
                `)
                .order("created_at", {
                    ascending: false,
                });

        setClientes(clientesData || []);
        setProdutos(produtosData || []);
        setVendas(vendasData || []);
    }

    async function registrarVenda() {

        if (!clienteId || !produtoId) {
            return;
        }

        const produto =
            produtos.find(
                (p) => p.id === produtoId
            );

        if (!produto) return;

        if (produto.estoque < quantidade) {

            alert("Estoque insuficiente");
            return;
        }

        const valorTotal =
            Number(produto.preco) *
            quantidade;

        const saldoRestante =
            valorTotal - entrada;

        // =========================
        // CRIA VENDA
        // =========================

        const { data: vendaCriada } =
            await supabase
                .from("vendas")
                .insert([{
                    cliente_id: clienteId,
                    produto_id: produtoId,
                    quantidade,
                    valor_unitario: produto.preco,
                    valor_total: valorTotal,
                    forma_pagamento: formaPagamento,
                    parcelado,
                    parcelas:
                        parcelado === "sim"
                            ? parcelas
                            : 1,
                    entrada,
                    saldo_restante:
                        saldoRestante,
                    primeiro_vencimento:
                        primeiroVencimento || null,
                }])
                .select()
                .single();

        // =========================
        // BAIXA ESTOQUE
        // =========================

        await supabase
            .from("produtos")
            .update({
                estoque:
                    produto.estoque -
                    quantidade,
            })
            .eq("id", produtoId);

        // =========================
        // CONTAS A RECEBER
        // =========================

        if (
            parcelado === "sim" &&
            vendaCriada
        ) {

            const valorParcela =
                saldoRestante / parcelas;

            const contas = [];

            const dataBase =
                primeiroVencimento
                    ? new Date(primeiroVencimento)
                    : new Date();

            for (
                let i = 1;
                i <= parcelas;
                i++
            ) {

                const vencimento =
                    new Date(dataBase);

                vencimento.setMonth(
                    vencimento.getMonth() +
                    (i - 1)
                );

                contas.push({

                    venda_id:
                        vendaCriada.id,

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
                        "pendente",
                });
            }

            await supabase
                .from("contas_receber")
                .insert(contas);
        }

        // =========================
        // RESET
        // =========================

        setClienteId("");
        setProdutoId("");
        setQuantidade(1);
        setFormaPagamento("pix");
        setParcelado("nao");
        setParcelas(1);
        setEntrada(0);
        setPrimeiroVencimento("");

        carregarDados();
    }

    useEffect(() => {

        carregarDados();

    }, []);

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            <h1 className="text-3xl md:text-4xl font-bold mb-8">
                Vendas
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-8">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

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
                            Cliente
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
                        value={produtoId}
                        onChange={(e) =>
                            setProdutoId(
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
                                {p.nome}
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
                        placeholder="Quantidade"
                    />

                    <select
                        value={formaPagamento}
                        onChange={(e) =>
                            setFormaPagamento(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded-xl"
                    >

                        <option value="pix">
                            PIX
                        </option>

                        <option value="dinheiro">
                            Dinheiro
                        </option>

                        <option value="cartao">
                            Cartão
                        </option>

                        <option value="boleto">
                            Boleto
                        </option>

                    </select>

                    <select
                        value={parcelado}
                        onChange={(e) =>
                            setParcelado(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded-xl"
                    >

                        <option value="nao">
                            À vista
                        </option>

                        <option value="sim">
                            Parcelado
                        </option>

                    </select>

                    {parcelado === "sim" && (

                        <>
                            <input
                                type="number"
                                min={1}
                                max={24}
                                value={parcelas}
                                onChange={(e) =>
                                    setParcelas(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="border p-3 rounded-xl"
                                placeholder="Parcelas"
                            />

                            <input
                                type="number"
                                min={0}
                                value={entrada}
                                onChange={(e) =>
                                    setEntrada(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="border p-3 rounded-xl"
                                placeholder="Entrada"
                            />

                            <input
                                type="date"
                                value={
                                    primeiroVencimento
                                }
                                onChange={(e) =>
                                    setPrimeiroVencimento(
                                        e.target.value
                                    )
                                }
                                className="border p-3 rounded-xl"
                            />
                        </>

                    )}

                </div>

                <button
                    onClick={registrarVenda}
                    className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
                >
                    Registrar Venda
                </button>

            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="p-4 text-left">
                                    Cliente
                                </th>

                                <th className="p-4 text-left">
                                    Produto
                                </th>

                                <th className="p-4 text-left">
                                    Total
                                </th>

                                <th className="p-4 text-left">
                                    Entrada
                                </th>

                                <th className="p-4 text-left">
                                    Saldo
                                </th>

                                <th className="p-4 text-left">
                                    Pagamento
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {vendas.map((v) => (

                                <tr
                                    key={v.id}
                                    className="border-t"
                                >

                                    <td className="p-4">
                                        {v.clientes?.nome}
                                    </td>

                                    <td className="p-4">
                                        {v.produtos?.nome}
                                    </td>

                                    <td className="p-4">
                                        R$ {Number(v.valor_total).toFixed(2)}
                                    </td>

                                    <td className="p-4 text-green-600">
                                        R$ {Number(v.entrada || 0).toFixed(2)}
                                    </td>

                                    <td className="p-4 text-red-600">
                                        R$ {Number(v.saldo_restante || 0).toFixed(2)}
                                    </td>

                                    <td className="p-4">

                                        {v.parcelado === "sim"
                                            ? `${v.parcelas}x`
                                            : "À vista"}

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