"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProdutosPage() {

    const [produtos, setProdutos] = useState<any[]>([]);
    const [busca, setBusca] = useState("");
    const [editandoId, setEditandoId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nome: "",
        sku: "",
        categoria: "",
        preco: "",
        custo: "",
        estoque: "",
        estoque_minimo: "",
    });

    // 🔥 FUNÇÃO DE MÁSCARA (vírgula automática)
    function formatMoney(value: string) {
        const onlyNumbers = value.replace(/\D/g, "");

        const number = (Number(onlyNumbers) / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
        });

        return number;
    }

    async function carregarProdutos() {

        const { data } = await supabase
            .from("produtos")
            .select("*")
            .order("created_at", { ascending: false });

        setProdutos(data || []);
    }

    async function salvarProduto() {

        if (!form.nome) return;

        const payload = {
            ...form,
            preco: Number(form.preco.replace(/\D/g, "")) / 100,
            custo: Number(form.custo.replace(/\D/g, "")) / 100,
            estoque: Number(form.estoque),
            estoque_minimo: Number(form.estoque_minimo),
        };

        if (editandoId) {

            await supabase
                .from("produtos")
                .update(payload)
                .eq("id", editandoId);

        } else {

            await supabase
                .from("produtos")
                .insert([payload]);
        }

        limparFormulario();
        carregarProdutos();
    }

    function limparFormulario() {

        setForm({
            nome: "",
            sku: "",
            categoria: "",
            preco: "",
            custo: "",
            estoque: "",
            estoque_minimo: "",
        });

        setEditandoId(null);
    }

    function editarProduto(produto: any) {

        setEditandoId(produto.id);

        setForm({
            nome: produto.nome || "",
            sku: produto.sku || "",
            categoria: produto.categoria || "",
            preco: produto.preco
                ? (produto.preco * 100).toFixed(0)
                : "",
            custo: produto.custo
                ? (produto.custo * 100).toFixed(0)
                : "",
            estoque: String(produto.estoque || ""),
            estoque_minimo: String(produto.estoque_minimo || ""),
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function excluirProduto(id: string) {

        await supabase
            .from("produtos")
            .delete()
            .eq("id", id);

        carregarProdutos();
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {

        const { name, value } = e.target;

        // 💰 aplica máscara apenas em preço e custo
        if (name === "preco" || name === "custo") {
            setForm({
                ...form,
                [name]: formatMoney(value),
            });
            return;
        }

        setForm({
            ...form,
            [name]: value,
        });
    }

    const produtosFiltrados = produtos.filter((produto) => {

        const termo = busca.toLowerCase();

        return (
            (produto.nome || "").toLowerCase().includes(termo) ||
            (produto.sku || "").toLowerCase().includes(termo) ||
            (produto.categoria || "").toLowerCase().includes(termo)
        );
    });

    useEffect(() => {
        carregarProdutos();
    }, []);

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Produtos
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-8">

                <div className="grid grid-cols-4 gap-4">

                    <input
                        name="nome"
                        placeholder="Nome do produto"
                        value={form.nome}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="sku"
                        placeholder="SKU"
                        value={form.sku}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="categoria"
                        placeholder="Categoria"
                        value={form.categoria}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="preco"
                        placeholder="Preço de venda"
                        value={form.preco}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="custo"
                        placeholder="Custo"
                        value={form.custo}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="estoque"
                        placeholder="Estoque"
                        value={form.estoque}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="estoque_minimo"
                        placeholder="Estoque mínimo"
                        value={form.estoque_minimo}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                </div>

                <button
                    onClick={salvarProduto}
                    className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
                >
                    {editandoId ? "Atualizar Produto" : "Salvar Produto"}
                </button>

            </div>

            <div className="mb-4">

                <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full border p-4 rounded-2xl"
                />

            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>
                            <th className="p-4 text-left">Produto</th>
                            <th className="p-4 text-left">Categoria</th>
                            <th className="p-4 text-left">Preço</th>
                            <th className="p-4 text-left">Estoque</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Ações</th>
                        </tr>

                    </thead>

                    <tbody>

                        {produtosFiltrados.map((produto) => (

                            <tr key={produto.id} className="border-t">

                                <td className="p-4">{produto.nome}</td>
                                <td className="p-4">{produto.categoria}</td>
                                <td className="p-4">
                                    R$ {Number(produto.preco).toFixed(2)}
                                </td>
                                <td className="p-4">{produto.estoque}</td>

                                <td className="p-4">

                                    {produto.estoque <= produto.estoque_minimo ? (

                                        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                                            Estoque Baixo
                                        </span>

                                    ) : (

                                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                                            OK
                                        </span>
                                    )}

                                </td>

                                <td className="p-4">

                                    <button
                                        onClick={() => editarProduto(produto)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => excluirProduto(produto.id)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                    >
                                        Excluir
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}