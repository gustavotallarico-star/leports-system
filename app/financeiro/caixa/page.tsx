"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Caixa = {
    id: string;
    abertura: number;
    entradas: number;
    saidas: number;
    saldo_final: number;
    data: string;
    status: string;
};

export default function CaixaPage() {

    const [caixas, setCaixas] =
        useState<Caixa[]>([]);

    const [abertura, setAbertura] =
        useState("");

    async function carregarCaixa() {

        const { data } = await supabase
            .from("caixa")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        setCaixas(data || []);
    }

    async function abrirCaixa() {

        const valor =
            Number(abertura);

        const { error } =
            await supabase
                .from("caixa")
                .insert([
                    {
                        abertura: valor,
                        entradas: 0,
                        saidas: 0,
                        saldo_final: valor,
                        data: new Date(),
                        status: "ABERTO",
                    },
                ]);

        if (error) {

            alert(error.message);

            return;
        }

        setAbertura("");

        carregarCaixa();
    }

    useEffect(() => {

        carregarCaixa();

    }, []);

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Caixa Diário
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-8">

                <div className="flex gap-4">

                    <input
                        type="number"
                        placeholder="Valor abertura"
                        value={abertura}
                        onChange={(e) =>
                            setAbertura(
                                e.target.value
                            )
                        }
                        className="border p-3 rounded-xl w-full"
                    />

                    <button
                        onClick={abrirCaixa}
                        className="bg-black text-white px-6 rounded-xl"
                    >
                        Abrir Caixa
                    </button>

                </div>

            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <table className="w-full">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-4 text-left">
                                Data
                            </th>

                            <th className="p-4 text-left">
                                Abertura
                            </th>

                            <th className="p-4 text-left">
                                Entradas
                            </th>

                            <th className="p-4 text-left">
                                Saídas
                            </th>

                            <th className="p-4 text-left">
                                Saldo Final
                            </th>

                            <th className="p-4 text-left">
                                Status
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {caixas.map((caixa) => (

                            <tr
                                key={caixa.id}
                                className="border-t"
                            >

                                <td className="p-4">
                                    {new Date(
                                        caixa.data
                                    ).toLocaleDateString()}
                                </td>

                                <td className="p-4">
                                    R$ {Number(
                                        caixa.abertura
                                    ).toFixed(2)}
                                </td>

                                <td className="p-4">
                                    R$ {Number(
                                        caixa.entradas
                                    ).toFixed(2)}
                                </td>

                                <td className="p-4">
                                    R$ {Number(
                                        caixa.saidas
                                    ).toFixed(2)}
                                </td>

                                <td className="p-4 font-bold">
                                    R$ {Number(
                                        caixa.saldo_final
                                    ).toFixed(2)}
                                </td>

                                <td className="p-4">

                                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">

                                        {caixa.status}

                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}