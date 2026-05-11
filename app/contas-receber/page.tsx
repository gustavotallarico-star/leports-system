"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verificarAuth } from "@/lib/protect";

export default function ContasReceberPage() {

    const router = useRouter();

    const [contas, setContas] = useState<any[]>([]);
    const [filtro, setFiltro] = useState("todos");

    useEffect(() => {

        verificarAuth(router);

        carregar();

    }, [router]);

    async function carregar() {

        const { data } = await supabase
            .from("contas_receber")
            .select(`
                *,
                clientes(nome)
            `)
            .order("data_vencimento", {
                ascending: true,
            });

        setContas(data || []);
    }

    async function receberPagamento(
        conta: any,
        valorRecebido: number
    ) {

        const novoValorPago =
            Number(conta.valor_pago || 0) +
            valorRecebido;

        const novoSaldo =
            Number(conta.valor) -
            novoValorPago;

        const status =
            novoSaldo <= 0
                ? "pago"
                : "pendente";

        await supabase
            .from("contas_receber")
            .update({
                valor_pago: novoValorPago,
                saldo_restante: novoSaldo,
                status,
            })
            .eq("id", conta.id);

        carregar();
    }

    function isAtrasado(
        vencimento: string,
        status: string
    ) {

        if (status === "pago") {
            return false;
        }

        const hoje = new Date();

        const dataVenc =
            new Date(vencimento);

        return dataVenc < hoje;
    }

    const contasFiltradas =
        contas.filter((c) => {

            if (filtro === "todos") {
                return true;
            }

            if (filtro === "pendente") {
                return c.status === "pendente";
            }

            if (filtro === "pago") {
                return c.status === "pago";
            }

            if (filtro === "atrasado") {

                return isAtrasado(
                    c.data_vencimento,
                    c.status
                );
            }

            return true;
        });

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            <h1 className="text-3xl md:text-4xl font-bold mb-6">
                Contas a Receber
            </h1>

            <div className="mb-6 flex flex-wrap gap-3">

                <button
                    onClick={() => setFiltro("todos")}
                    className="px-4 py-2 bg-black text-white rounded-xl"
                >
                    Todos
                </button>

                <button
                    onClick={() => setFiltro("pendente")}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-xl"
                >
                    Pendentes
                </button>

                <button
                    onClick={() => setFiltro("pago")}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl"
                >
                    Pagos
                </button>

                <button
                    onClick={() => setFiltro("atrasado")}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl"
                >
                    Atrasados
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
                                    Valores
                                </th>

                                <th className="p-4 text-left">
                                    Vencimento
                                </th>

                                <th className="p-4 text-left">
                                    Parcela
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

                            {contasFiltradas.map((c) => {

                                const atrasado =
                                    isAtrasado(
                                        c.data_vencimento,
                                        c.status
                                    );

                                return (

                                    <tr
                                        key={c.id}
                                        className="border-t"
                                    >

                                        <td className="p-4">
                                            {c.clientes?.nome}
                                        </td>

                                        <td className="p-4">

                                            <div>

                                                <p>
                                                    Total:
                                                    R$ {Number(c.valor).toFixed(2)}
                                                </p>

                                                <p className="text-green-600 text-sm">
                                                    Pago:
                                                    R$ {Number(c.valor_pago || 0).toFixed(2)}
                                                </p>

                                                <p className="text-red-600 text-sm">
                                                    Saldo:
                                                    R$ {Number(
                                                        c.saldo_restante || c.valor
                                                    ).toFixed(2)}
                                                </p>

                                            </div>

                                        </td>

                                        <td className={`p-4 ${atrasado
                                                ? "text-red-600 font-bold"
                                                : ""
                                            }`}>

                                            {c.data_vencimento}

                                        </td>

                                        <td className="p-4">
                                            {c.parcela}/{c.total_parcelas}
                                        </td>

                                        <td className="p-4">

                                            {c.status === "pago" ? (

                                                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                                                    Pago
                                                </span>

                                            ) : atrasado ? (

                                                <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                                                    Atrasado
                                                </span>

                                            ) : (

                                                <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
                                                    Pendente
                                                </span>

                                            )}

                                        </td>

                                        <td className="p-4">

                                            {c.status !== "pago" && (

                                                <button
                                                    onClick={() => {

                                                        const valor =
                                                            prompt(
                                                                "Valor recebido:"
                                                            );

                                                        if (!valor) {
                                                            return;
                                                        }

                                                        receberPagamento(
                                                            c,
                                                            Number(valor)
                                                        );
                                                    }}
                                                    className="bg-green-600 text-white px-3 py-1 rounded-lg"
                                                >
                                                    Receber
                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                );
                            })}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}