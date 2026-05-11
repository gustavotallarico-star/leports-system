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

    const [formaPagamento, setFormaPagamento] = useState("pix");
    const [parcelado, setParcelado] = useState("nao");
    const [parcelas, setParcelas] = useState(1);

    async function carregarDados() {

        const { data: clientesData } =
            await supabase.from("clientes").select("*");

        const { data: produtosData } =
            await supabase.from("produtos").select("*");

        const { data: vendasData } =
            await supabase
                .from("vendas")
                .select(`
                    *,
                    clientes(nome),
                    produtos(nome)
                `)
                .order("created_at", { ascending: false });

        setClientes(clientesData || []);
        setProdutos(produtosData || []);
        setVendas(vendasData || []);
    }

    async function registrarVenda() {

        if (!clienteId || !produtoId) return;

        const produto = produtos.find(
            (p) => p.id === produtoId
        );

        if (!produto) return;

        if (produto.estoque < quantidade) {
            alert("Estoque insuficiente");
            return;
        }

        const valorTotal =
            Number(produto.preco) * quantidade;

        // 1️⃣ CRIA VENDA
        const { data: vendaCriada } = await supabase
            .from("vendas")
            .insert([{
                cliente_id: clienteId,
                produto_id: produtoId,
                quantidade,
                valor_unitario: produto.preco,
                valor_total: valorTotal,
                forma_pagamento: formaPagamento,
                parcelado,
                parcelas: parcelado === "sim" ? parcelas : 1,
            }])
            .select()
            .single();

        // 2️⃣ BAIXA ESTOQUE
        await supabase
            .from("produtos")
            .update({
                estoque: produto.estoque - quantidade,
            })
            .eq("id", produtoId);

        // 3️⃣ GERAR CONTAS A RECEBER (SE PARCELADO)
        if (parcelado === "sim" && vendaCriada) {

            const valorParcela = valorTotal / parcelas;

            const contas = [];

            for (let i = 1; i <= parcelas; i++) {

                const vencimento = new Date();
                vencimento.setDate(vencimento.getDate() + (30 * i));

                contas.push({
                    venda_id: vendaCriada.id,
                    cliente_id: clienteId,
                    valor: valorParcela,
                    parcela: i,
                    total_parcelas: parcelas,
                    data_vencimento: vencimento,
                    status: "pendente"
                });
            }

            await supabase
                .from("contas_receber")
                .insert(contas);
        }

        // RESET FORM
        setClienteId("");
        setProdutoId("");
        setQuantidade(1);
        setFormaPagamento("pix");
        setParcelado("nao");
        setParcelas(1);

        carregarDados();
    }

    useEffect(() => {
        carregarDados();
    }, []);

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Vendas
            </h1>

            {/* FORM */}
            <div className="bg-white p-6 rounded-2xl shadow-md mb-8">

                <div className="grid grid-cols-3 gap-4">

                    <select
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        className="border p-3 rounded-xl"
                    >
                        <option value="">Cliente</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nome}
                            </option>
                        ))}
                    </select>

                    <select
                        value={produtoId}
                        onChange={(e) => setProdutoId(e.target.value)}
                        className="border p-3 rounded-xl"
                    >
                        <option value="">Produto</option>
                        {produtos.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nome}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        min={1}
                        value={quantidade}
                        onChange={(e) =>
                            setQuantidade(Number(e.target.value))
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
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao">Cartão</option>
                        <option value="boleto">Boleto</option>
                    </select>

                    <select
                        value={parcelado}
                        onChange={(e) =>
                            setParcelado(e.target.value)
                        }
                        className="border p-3 rounded-xl"
                    >
                        <option value="nao">À vista</option>
                        <option value="sim">Parcelado</option>
                    </select>

                    {parcelado === "sim" && (
                        <input
                            type="number"
                            min={1}
                            max={24}
                            value={parcelas}
                            onChange={(e) =>
                                setParcelas(Number(e.target.value))
                            }
                            className="border p-3 rounded-xl"
                            placeholder="Parcelas"
                        />
                    )}

                </div>

                <button
                    onClick={registrarVenda}
                    className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
                >
                    Registrar Venda
                </button>

            </div>

            {/* TABELA */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 text-left">Cliente</th>
                            <th className="p-4 text-left">Produto</th>
                            <th className="p-4 text-left">Qtd</th>
                            <th className="p-4 text-left">Total</th>
                            <th className="p-4 text-left">Pagamento</th>
                        </tr>
                    </thead>

                    <tbody>

                        {vendas.map((v) => (

                            <tr key={v.id} className="border-t">

                                <td className="p-4">{v.clientes?.nome}</td>
                                <td className="p-4">{v.produtos?.nome}</td>
                                <td className="p-4">{v.quantidade}</td>

                                <td className="p-4">
                                    R$ {Number(v.valor_total).toFixed(2)}
                                </td>

                                <td className="p-4">
                                    {v.forma_pagamento?.toUpperCase()}{" "}
                                    {v.parcelado === "sim"
                                        ? `${v.parcelas}x`
                                        : "à vista"}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}