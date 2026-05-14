"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DespesasPage() {

    const [despesas, setDespesas] =
        useState<any[]>([]);

    const [form, setForm] = useState({
        descricao: "",
        categoria: "",
        valor: "",
        forma_pagamento: "",
        observacoes: "",
    });

    async function carregarDespesas() {

        const { data } = await supabase
            .from("despesas")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        setDespesas(data || []);
    }

    async function salvarDespesa() {

        const { error } =
            await supabase
                .from("despesas")
                .insert([
                    {
                        ...form,
                        valor: Number(form.valor),
                        data: new Date(),
                    },
                ]);

        if (error) {

            alert(error.message);

            return;
        }

        setForm({
            descricao: "",
            categoria: "",
            valor: "",
            forma_pagamento: "",
            observacoes: "",
        });

        carregarDespesas();
    }

    useEffect(() => {

        carregarDespesas();

    }, []);

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Despesas
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-8">

                <div className="grid grid-cols-2 gap-4">

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
                        className="border p-3 rounded-xl"
                    />

                    <input
                        placeholder="Categoria"
                        value={form.categoria}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                categoria:
                                    e.target.value,
                            })
                        }
                        className="border p-3 rounded-xl"
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
                        className="border p-3 rounded-xl"
                    />

                    <input
                        placeholder="Forma pagamento"
                        value={form.forma_pagamento}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                forma_pagamento:
                                    e.target.value,
                            })
                        }
                        className="border p-3 rounded-xl"
                    />

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
                    className="w-full border p-3 rounded-xl mt-4"
                />

                <button
                    onClick={salvarDespesa}
                    className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
                >
                    Salvar Despesa
                </button>

            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-4 text-left">
                                Descrição
                            </th>

                            <th className="p-4 text-left">
                                Categoria
                            </th>

                            <th className="p-4 text-left">
                                Valor
                            </th>

                            <th className="p-4 text-left">
                                Data
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {despesas.map((despesa) => (

                            <tr
                                key={despesa.id}
                                className="border-t"
                            >

                                <td className="p-4">
                                    {despesa.descricao}
                                </td>

                                <td className="p-4">
                                    {despesa.categoria}
                                </td>

                                <td className="p-4">
                                    R$ {Number(
                                        despesa.valor
                                    ).toFixed(2)}
                                </td>

                                <td className="p-4">
                                    {new Date(
                                        despesa.data
                                    ).toLocaleDateString()}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}