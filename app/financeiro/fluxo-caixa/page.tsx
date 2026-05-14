"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FluxoCaixaPage() {

    const [entradas, setEntradas] =
        useState(0);

    const [saidas, setSaidas] =
        useState(0);

    const [saldo, setSaldo] =
        useState(0);

    async function carregarFluxo() {

        // ENTRADAS

        const { data: vendas } =
            await supabase
                .from("vendas")
                .select("total");

        let totalEntradas = 0;

        vendas?.forEach((venda: any) => {

            totalEntradas +=
                Number(venda.total);
        });

        // SAIDAS

        const { data: despesas } =
            await supabase
                .from("despesas")
                .select("valor");

        let totalSaidas = 0;

        despesas?.forEach((despesa: any) => {

            totalSaidas +=
                Number(despesa.valor);
        });

        setEntradas(totalEntradas);

        setSaidas(totalSaidas);

        setSaldo(
            totalEntradas - totalSaidas
        );
    }

    useEffect(() => {

        carregarFluxo();

    }, []);

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-4xl font-bold mb-8">
                Fluxo de Caixa
            </h1>

            <div className="grid grid-cols-3 gap-6">

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Entradas
                    </p>

                    <h2 className="text-3xl font-bold text-green-600">

                        R$ {entradas.toFixed(2)}

                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Saídas
                    </p>

                    <h2 className="text-3xl font-bold text-red-600">

                        R$ {saidas.toFixed(2)}

                    </h2>

                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <p className="text-gray-500 mb-2">
                        Saldo
                    </p>

                    <h2 className="text-3xl font-bold text-blue-600">

                        R$ {saldo.toFixed(2)}

                    </h2>

                </div>

            </div>

        </div>
    );
}