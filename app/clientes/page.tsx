"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verificarAuth } from "@/lib/protect";

export default function ClientesPage() {

    const router = useRouter();

    const [clientes, setClientes] = useState<any[]>([]);
    const [busca, setBusca] = useState("");
    const [editandoId, setEditandoId] =
        useState<string | null>(null);

    const [form, setForm] = useState({
        nome: "",
        telefone: "",
        email: "",
        cpf: "",
        cep: "",
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        complemento: "",
    });

    useEffect(() => {

        verificarAuth(router);

        carregarClientes();

    }, [router]);

    async function carregarClientes() {

        const { data } = await supabase
            .from("clientes")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        setClientes(data || []);
    }

    async function salvarCliente() {

        if (!form.nome) return;

        if (editandoId) {

            await supabase
                .from("clientes")
                .update(form)
                .eq("id", editandoId);

        } else {

            await supabase
                .from("clientes")
                .insert([form]);
        }

        setForm({
            nome: "",
            telefone: "",
            email: "",
            cpf: "",
            cep: "",
            endereco: "",
            numero: "",
            bairro: "",
            cidade: "",
            estado: "",
            complemento: "",
        });

        setEditandoId(null);

        carregarClientes();
    }

    function editarCliente(cliente: any) {

        setEditandoId(cliente.id);

        setForm({
            nome: cliente.nome || "",
            telefone: cliente.telefone || "",
            email: cliente.email || "",
            cpf: cliente.cpf || "",
            cep: cliente.cep || "",
            endereco: cliente.endereco || "",
            numero: cliente.numero || "",
            bairro: cliente.bairro || "",
            cidade: cliente.cidade || "",
            estado: cliente.estado || "",
            complemento: cliente.complemento || "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    async function alterarInadimplencia(
        id: string,
        status: boolean
    ) {

        await supabase
            .from("clientes")
            .update({
                inadimplente: !status
            })
            .eq("id", id);

        carregarClientes();
    }

    async function excluirCliente(id: string) {

        await supabase
            .from("clientes")
            .delete()
            .eq("id", id);

        carregarClientes();
    }

    function formatarCPF(valor: string) {

        return valor
            .replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            .slice(0, 14);
    }

    function formatarTelefone(valor: string) {

        return valor
            .replace(/\D/g, "")
            .replace(/^(\d{2})(\d)/g, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .slice(0, 15);
    }

    function formatarCEP(valor: string) {

        return valor
            .replace(/\D/g, "")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .slice(0, 9);
    }

    async function buscarCEP(cep: string) {

        const cepLimpo =
            cep.replace(/\D/g, "");

        if (cepLimpo.length !== 8) return;

        try {

            const response =
                await fetch(
                    `https://viacep.com.br/ws/${cepLimpo}/json/`
                );

            const data =
                await response.json();

            if (data.erro) return;

            setForm((prev) => ({
                ...prev,
                endereco: data.logradouro || "",
                bairro: data.bairro || "",
                cidade: data.localidade || "",
                estado: data.uf || "",
            }));

        } catch (error) {

            console.log(error);
        }
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {

        let valor = e.target.value;

        if (e.target.name === "cpf") {
            valor = formatarCPF(valor);
        }

        if (e.target.name === "telefone") {
            valor = formatarTelefone(valor);
        }

        if (e.target.name === "cep") {

            valor = formatarCEP(valor);

            buscarCEP(valor);
        }

        setForm({
            ...form,
            [e.target.name]: valor,
        });
    }

    const clientesFiltrados =
        clientes.filter((cliente) => {

            const termo =
                busca.toLowerCase();

            return (

                (cliente.nome || "")
                    .toLowerCase()
                    .includes(termo)

                ||

                (cliente.telefone || "")
                    .toLowerCase()
                    .includes(termo)

                ||

                (cliente.email || "")
                    .toLowerCase()
                    .includes(termo)

                ||

                (cliente.cpf || "")
                    .toLowerCase()
                    .includes(termo)

                ||

                (cliente.cidade || "")
                    .toLowerCase()
                    .includes(termo)
            );
        });

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            <h1 className="text-3xl md:text-4xl font-bold mb-8">
                Clientes
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-8">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                    <input
                        name="nome"
                        placeholder="Nome completo"
                        value={form.nome}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="telefone"
                        placeholder="Telefone"
                        value={form.telefone}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="cpf"
                        placeholder="CPF"
                        value={form.cpf}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="cep"
                        placeholder="CEP"
                        value={form.cep}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="estado"
                        placeholder="Estado"
                        value={form.estado}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="cidade"
                        placeholder="Cidade"
                        value={form.cidade}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="bairro"
                        placeholder="Bairro"
                        value={form.bairro}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="numero"
                        placeholder="Número"
                        value={form.numero}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                    <input
                        name="endereco"
                        placeholder="Endereço"
                        value={form.endereco}
                        onChange={handleChange}
                        className="border p-3 rounded-xl md:col-span-2"
                    />

                    <input
                        name="complemento"
                        placeholder="Complemento"
                        value={form.complemento}
                        onChange={handleChange}
                        className="border p-3 rounded-xl"
                    />

                </div>

                <button
                    onClick={salvarCliente}
                    className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
                >
                    {editandoId
                        ? "Atualizar Cliente"
                        : "Salvar Cliente"}
                </button>

            </div>

            <div className="mb-4">

                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                    className="w-full border p-4 rounded-2xl"
                />

            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="p-4 text-left">
                                    Nome
                                </th>

                                <th className="p-4 text-left">
                                    Telefone
                                </th>

                                <th className="p-4 text-left">
                                    Email
                                </th>

                                <th className="p-4 text-left">
                                    Cidade
                                </th>

                                <th className="p-4 text-left">
                                    Ações
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {clientesFiltrados.map((cliente) => (

                                <tr
                                    key={cliente.id}
                                    className="border-t"
                                >

                                    <td className="p-4">

                                        <div className="flex items-center gap-2">

                                            {cliente.nome}

                                            {cliente.inadimplente && (

                                                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">

                                                    Inadimplente

                                                </span>

                                            )}

                                        </div>

                                    </td>

                                    <td className="p-4">
                                        {cliente.telefone}
                                    </td>

                                    <td className="p-4">
                                        {cliente.email}
                                    </td>

                                    <td className="p-4">
                                        {cliente.cidade}
                                    </td>

                                    <td className="p-4">

                                        <button
                                            onClick={() =>
                                                editarCliente(cliente)
                                            }
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            onClick={() =>
                                                alterarInadimplencia(
                                                    cliente.id,
                                                    cliente.inadimplente
                                                )
                                            }
                                            className={`px-4 py-2 rounded-lg text-white mr-2 ${cliente.inadimplente
                                                    ? "bg-green-600"
                                                    : "bg-orange-500"
                                                }`}
                                        >

                                            {cliente.inadimplente
                                                ? "Regularizar"
                                                : "Inadimplente"}

                                        </button>

                                        <button
                                            onClick={() =>
                                                excluirCliente(cliente.id)
                                            }
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

        </div>
    );
}