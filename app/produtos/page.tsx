"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

// ========================================
// TYPES
// ========================================

interface Produto {
    id: string;
    nome: string;
    sku: string;
    categoria: string;
    preco: number;
    custo: number;
    estoque: number;
    estoque_minimo: number;
    created_at?: string;
}

// ========================================
// PAGE
// ========================================

export default function ProdutosPage() {

    // ========================================
    // STATES
    // ========================================

    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(false);

    const [editandoId, setEditandoId] =
        useState<string | null>(null);

    const [form, setForm] = useState({
        nome: "",
        sku: "",
        categoria: "",
        preco: "",
        custo: "",
        estoque: "",
        estoque_minimo: "",
    });

    // ========================================
    // FORMATADORES
    // ========================================

    function formatMoney(value: string) {

        const onlyNumbers = value.replace(/\D/g, "");

        const number = (
            Number(onlyNumbers) / 100
        ).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
        });

        return number;
    }

    function formatarReal(valor: number) {

        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    // ========================================
    // LOAD
    // ========================================

    async function carregarProdutos() {

        try {

            setLoading(true);

            const { data, error } = await supabase
                .from("produtos")
                .select("*")
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.log(error);
                alert("Erro ao carregar produtos");
                return;
            }

            setProdutos(data || []);

        } finally {

            setLoading(false);
        }
    }

    // ========================================
    // SALVAR
    // ========================================

    async function salvarProduto() {

        try {

            if (!form.nome.trim()) {
                alert("Digite o nome do produto");
                return;
            }

            if (!form.preco) {
                alert("Digite o preço");
                return;
            }

            if (Number(form.estoque) < 0) {
                alert("Estoque inválido");
                return;
            }

            const payload = {

                nome: form.nome,
                sku: form.sku,
                categoria: form.categoria,

                preco:
                    Number(
                        form.preco.replace(/\D/g, "")
                    ) / 100,

                custo:
                    Number(
                        form.custo.replace(/\D/g, "")
                    ) / 100,

                estoque:
                    Number(form.estoque),

                estoque_minimo:
                    Number(form.estoque_minimo),
            };

            if (editandoId) {

                const { error } = await supabase
                    .from("produtos")
                    .update(payload)
                    .eq("id", editandoId);

                if (error) {
                    console.log(error);
                    alert("Erro ao atualizar produto");
                    return;
                }

                alert("Produto atualizado");

            } else {

                const { error } = await supabase
                    .from("produtos")
                    .insert([payload]);

                if (error) {
                    console.log(error);
                    alert("Erro ao salvar produto");
                    return;
                }

                alert("Produto cadastrado");
            }

            limparFormulario();

            carregarProdutos();

        } catch (error) {

            console.log(error);

            alert("Erro inesperado");
        }
    }

    // ========================================
    // LIMPAR
    // ========================================

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

    // ========================================
    // EDITAR
    // ========================================

    function editarProduto(produto: Produto) {

        setEditandoId(produto.id);

        setForm({

            nome: produto.nome || "",

            sku: produto.sku || "",

            categoria: produto.categoria || "",

            preco: produto.preco
                ? formatMoney(
                    String(produto.preco * 100)
                )
                : "",

            custo: produto.custo
                ? formatMoney(
                    String(produto.custo * 100)
                )
                : "",

            estoque: String(produto.estoque || ""),

            estoque_minimo: String(
                produto.estoque_minimo || ""
            ),
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // ========================================
    // EXCLUIR
    // ========================================

    async function excluirProduto(id: string) {

        const confirmar = confirm(
            "Deseja realmente excluir este produto?"
        );

        if (!confirmar) return;

        try {

            const { error } = await supabase
                .from("produtos")
                .delete()
                .eq("id", id);

            if (error) {
                console.log(error);
                alert("Erro ao excluir produto");
                return;
            }

            alert("Produto excluído");

            carregarProdutos();

        } catch (error) {

            console.log(error);

            alert("Erro inesperado");
        }
    }

    // ========================================
    // CHANGE INPUT
    // ========================================

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {

        const { name, value } = e.target;

        // PREÇO E CUSTO

        if (
            name === "preco" ||
            name === "custo"
        ) {

            setForm({
                ...form,
                [name]: formatMoney(value),
            });

            return;
        }

        // NUMÉRICOS

        if (
            name === "estoque" ||
            name === "estoque_minimo"
        ) {

            const onlyNumbers =
                value.replace(/\D/g, "");

            setForm({
                ...form,
                [name]: onlyNumbers,
            });

            return;
        }

        // DEFAULT

        setForm({
            ...form,
            [name]: value,
        });
    }

    // ========================================
    // FILTRO
    // ========================================

    const produtosFiltrados = useMemo(() => {

        const termo = busca.toLowerCase();

        return produtos.filter((produto) => {

            return (

                (produto.nome || "")
                    .toLowerCase()
                    .includes(termo)

                ||

                (produto.sku || "")
                    .toLowerCase()
                    .includes(termo)

                ||

                (produto.categoria || "")
                    .toLowerCase()
                    .includes(termo)
            );
        });

    }, [busca, produtos]);

    // ========================================
    // INIT
    // ========================================

    useEffect(() => {

        carregarProdutos();

    }, []);

    // ========================================
    // UI
    // ========================================

    return (

        <div className="min-h-screen bg-gray-100 p-4 md:p-10">

            {/* HEADER */}

            <div className="flex items-center justify-between mb-8">

                <div>

                    <h1 className="text-3xl md:text-4xl font-bold">
                        Produtos
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Cadastro e gerenciamento de produtos
                    </p>

                </div>

            </div>

            {/* FORM */}

            <div className="bg-white p-6 rounded-3xl shadow-md mb-8">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

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

                <div className="flex gap-4 mt-6">

                    <button
                        onClick={salvarProduto}
                        className="bg-black text-white px-6 py-3 rounded-xl"
                    >
                        {editandoId
                            ? "Atualizar Produto"
                            : "Salvar Produto"}
                    </button>

                    {editandoId && (

                        <button
                            onClick={limparFormulario}
                            className="bg-gray-300 px-6 py-3 rounded-xl"
                        >
                            Cancelar
                        </button>
                    )}

                </div>

            </div>

            {/* BUSCA */}

            <div className="mb-6">

                <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                    className="w-full border p-4 rounded-2xl"
                />

            </div>

            {/* TABELA */}

            <div className="bg-white rounded-3xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="p-4 text-left">
                                    Produto
                                </th>

                                <th className="p-4 text-left">
                                    SKU
                                </th>

                                <th className="p-4 text-left">
                                    Categoria
                                </th>

                                <th className="p-4 text-left">
                                    Preço
                                </th>

                                <th className="p-4 text-left">
                                    Custo
                                </th>

                                <th className="p-4 text-left">
                                    Estoque
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

                            {loading && (

                                <tr>

                                    <td
                                        colSpan={8}
                                        className="p-10 text-center"
                                    >
                                        Carregando...
                                    </td>

                                </tr>
                            )}

                            {!loading &&
                                produtosFiltrados.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan={8}
                                            className="p-10 text-center"
                                        >
                                            Nenhum produto encontrado
                                        </td>

                                    </tr>
                                )}

                            {!loading &&
                                produtosFiltrados.map((produto) => (

                                    <tr
                                        key={produto.id}
                                        className="border-t"
                                    >

                                        <td className="p-4 font-medium">
                                            {produto.nome}
                                        </td>

                                        <td className="p-4">
                                            {produto.sku}
                                        </td>

                                        <td className="p-4">
                                            {produto.categoria}
                                        </td>

                                        <td className="p-4">
                                            {formatarReal(produto.preco)}
                                        </td>

                                        <td className="p-4">
                                            {formatarReal(produto.custo)}
                                        </td>

                                        <td className="p-4">
                                            {produto.estoque}
                                        </td>

                                        <td className="p-4">

                                            {produto.estoque <= produto.estoque_minimo ? (

                                                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs">
                                                    Estoque Baixo
                                                </span>

                                            ) : (

                                                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                                                    OK
                                                </span>
                                            )}

                                        </td>

                                        <td className="p-4">

                                            <div className="flex gap-2">

                                                <button
                                                    onClick={() =>
                                                        editarProduto(produto)
                                                    }
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        excluirProduto(produto.id)
                                                    }
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Excluir
                                                </button>

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