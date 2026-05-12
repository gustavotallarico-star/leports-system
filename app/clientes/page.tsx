"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verificarAuth } from "@/lib/protect";

interface Cliente {

    id: string;

    nome: string;

    telefone: string;

    email: string;

    cpf: string;

    cidade: string;

    inadimplente: boolean;

    total_compras?: number;

    total_pago?: number;

    total_aberto?: number;

    parcelas_atrasadas?: number;
}

export default function ClientesPage() {

    const router = useRouter();

    const [loading, setLoading] =
        useState(true);

    const [clientes, setClientes] =
        useState<Cliente[]>([]);

    const [busca, setBusca] =
        useState("");

    const [editandoId, setEditandoId] =
        useState<string | null>(null);

    const [salvando, setSalvando] =
        useState(false);

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

        observacoes: "",
    });

    useEffect(() => {

        verificarAuth(router);

        iniciarPagina();

    }, [router]);

    async function iniciarPagina() {

        setLoading(true);

        await atualizarInadimplencia();

        await carregarClientes();

        setLoading(false);
    }

    // =========================
    // ATUALIZA INADIMPLÊNCIA
    // =========================

    async function atualizarInadimplencia() {

        const { data: clientes } =
            await supabase
                .from("clientes")
                .select("id");

        if (!clientes) return;

        for (const cliente of clientes) {

            const { data: atrasadas } =
                await supabase
                    .from("contas_receber")
                    .select("id")
                    .eq("cliente_id", cliente.id)
                    .eq("status", "ATRASADO");

            const inadimplente =
                (atrasadas?.length || 0) > 0;

            await supabase
                .from("clientes")
                .update({
                    inadimplente
                })
                .eq("id", cliente.id);
        }
    }

    // =========================
    // CARREGAR CLIENTES
    // =========================

    async function carregarClientes() {

        let query = supabase

            .from("clientes")

            .select(`
                id,
                nome,
                telefone,
                email,
                cpf,
                cidade,
                inadimplente
            `)

            .order("created_at", {
                ascending: false,
            });

        if (busca) {

            query =
                query.or(`
                    nome.ilike.%${busca}%,
                    telefone.ilike.%${busca}%,
                    email.ilike.%${busca}%,
                    cpf.ilike.%${busca}%
                `);
        }

        const { data } = await query;

        if (!data) {

            setClientes([]);

            return;
        }

        // =========================
        // RESUMO FINANCEIRO
        // =========================

        const clientesFinanceiro =
            await Promise.all(

                data.map(async (cliente) => {

                    const {
                        data: vendas
                    } = await supabase

                        .from("vendas")

                        .select("valor_total")

                        .eq(
                            "cliente_id",
                            cliente.id
                        );

                    const {
                        data: pagos
                    } = await supabase

                        .from("contas_receber")

                        .select("valor")

                        .eq(
                            "cliente_id",
                            cliente.id
                        )

                        .eq("status", "PAGO");

                    const {
                        data: abertos
                    } = await supabase

                        .from("contas_receber")

                        .select("valor")

                        .eq(
                            "cliente_id",
                            cliente.id
                        )

                        .in("status", [
                            "PENDENTE",
                            "ATRASADO"
                        ]);

                    const {
                        data: atrasados
                    } = await supabase

                        .from("contas_receber")

                        .select("id")

                        .eq(
                            "cliente_id",
                            cliente.id
                        )

                        .eq(
                            "status",
                            "ATRASADO"
                        );

                    const totalCompras =
                        vendas?.reduce(
                            (acc, item) =>
                                acc + Number(item.valor_total),
                            0
                        ) || 0;

                    const totalPago =
                        pagos?.reduce(
                            (acc, item) =>
                                acc + Number(item.valor),
                            0
                        ) || 0;

                    const totalAberto =
                        abertos?.reduce(
                            (acc, item) =>
                                acc + Number(item.valor),
                            0
                        ) || 0;

                    return {

                        ...cliente,

                        total_compras:
                            totalCompras,

                        total_pago:
                            totalPago,

                        total_aberto:
                            totalAberto,

                        parcelas_atrasadas:
                            atrasados?.length || 0,
                    };
                })
            );

        setClientes(clientesFinanceiro);
    }

    // =========================
    // SALVAR CLIENTE
    // =========================

    async function salvarCliente() {

        if (!form.nome) {

            alert("Informe o nome");

            return;
        }

        setSalvando(true);

        // =========================
        // VALIDAR CPF DUPLICADO
        // =========================

        const { data: cpfExiste } =
            await supabase

                .from("clientes")

                .select("id")

                .eq("cpf", form.cpf)

                .neq(
                    "id",
                    editandoId || ""
                );

        if (cpfExiste &&
            cpfExiste.length > 0) {

            alert("CPF já cadastrado");

            setSalvando(false);

            return;
        }

        // =========================
        // UPDATE
        // =========================

        if (editandoId) {

            await supabase

                .from("clientes")

                .update(form)

                .eq("id", editandoId);

        } else {

            // =========================
            // INSERT
            // =========================

            await supabase

                .from("clientes")

                .insert([

                    {
                        ...form,
                        inadimplente: false,
                    }
                ]);
        }

        limparFormulario();

        await carregarClientes();

        setSalvando(false);
    }

    // =========================
    // LIMPAR FORM
    // =========================

    function limparFormulario() {

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

            observacoes: "",
        });

        setEditandoId(null);
    }

    // =========================
    // EDITAR
    // =========================

    function editarCliente(cliente: any) {

        setEditandoId(cliente.id);

        setForm({

            nome:
                cliente.nome || "",

            telefone:
                cliente.telefone || "",

            email:
                cliente.email || "",

            cpf:
                cliente.cpf || "",

            cep:
                cliente.cep || "",

            endereco:
                cliente.endereco || "",

            numero:
                cliente.numero || "",

            bairro:
                cliente.bairro || "",

            cidade:
                cliente.cidade || "",

            estado:
                cliente.estado || "",

            complemento:
                cliente.complemento || "",

            observacoes:
                cliente.observacoes || "",
        });

        window.scrollTo({

            top: 0,

            behavior: "smooth",
        });
    }

    // =========================
    // EXCLUIR
    // =========================

    async function excluirCliente(id: string) {

        const confirmar =
            confirm(
                "Deseja realmente excluir?"
            );

        if (!confirmar) return;

        await supabase

            .from("clientes")

            .delete()

            .eq("id", id);

        await carregarClientes();
    }

    // =========================
    // FORMATADORES
    // =========================

    function formatarCPF(valor: string) {

        return valor

            .replace(/\D/g, "")

            .replace(/(\d{3})(\d)/, "$1.$2")

            .replace(/(\d{3})(\d)/, "$1.$2")

            .replace(
                /(\d{3})(\d{1,2})$/,
                "$1-$2"
            )

            .slice(0, 14);
    }

    function formatarTelefone(valor: string) {

        return valor

            .replace(/\D/g, "")

            .replace(
                /^(\d{2})(\d)/g,
                "($1) $2"
            )

            .replace(
                /(\d{5})(\d)/,
                "$1-$2"
            )

            .slice(0, 15);
    }

    function formatarCEP(valor: string) {

        return valor

            .replace(/\D/g, "")

            .replace(
                /(\d{5})(\d)/,
                "$1-$2"
            )

            .slice(0, 9);
    }

    // =========================
    // VIA CEP
    // =========================

    async function buscarCEP(cep: string) {

        const cepLimpo =
            cep.replace(/\D/g, "");

        if (cepLimpo.length !== 8)
            return;

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

                endereco:
                    data.logradouro || "",

                bairro:
                    data.bairro || "",

                cidade:
                    data.localidade || "",

                estado:
                    data.uf || "",
            }));

        } catch (error) {

            console.log(error);
        }
    }

    // =========================
    // HANDLE CHANGE
    // =========================

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {

        let valor = e.target.value;

        if (e.target.name === "cpf") {

            valor = formatarCPF(valor);
        }

        if (
            e.target.name === "telefone"
        ) {

            valor =
                formatarTelefone(valor);
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

    // =========================
    // BUSCA
    // =========================

    useEffect(() => {

        carregarClientes();

    }, [busca]);

    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <p className="text-xl">
                    Carregando clientes...
                </p>

            </div>
        );
    }

    return (

        <div className="p-4 md:p-10 bg-gray-100 min-h-screen">

            <h1 className="text-3xl md:text-4xl font-bold mb-8">

                Clientes

            </h1>

            {/* FORMULÁRIO */}

            <div className="bg-white p-6 rounded-3xl shadow-md mb-8">

                <h2 className="text-2xl font-bold mb-6">

                    {editandoId
                        ? "Editar Cliente"
                        : "Novo Cliente"}

                </h2>

                {/* DADOS PESSOAIS */}

                <h3 className="font-semibold mb-4">

                    Dados pessoais

                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

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

                </div>

                {/* ENDEREÇO */}

                <h3 className="font-semibold mb-4">

                    Endereço

                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

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
                    disabled={salvando}
                    className="mt-8 bg-black text-white px-6 py-3 rounded-xl"
                >

                    {salvando
                        ? "Salvando..."
                        : editandoId
                            ? "Atualizar Cliente"
                            : "Salvar Cliente"}

                </button>

            </div>

            {/* BUSCA */}

            <div className="mb-6">

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

            {/* TABELA */}

            <div className="bg-white rounded-3xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1400px]">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="p-4 text-left">
                                    Cliente
                                </th>

                                <th className="p-4 text-left">
                                    Contato
                                </th>

                                <th className="p-4 text-left">
                                    Cidade
                                </th>

                                <th className="p-4 text-left">
                                    Compras
                                </th>

                                <th className="p-4 text-left">
                                    Pago
                                </th>

                                <th className="p-4 text-left">
                                    Em aberto
                                </th>

                                <th className="p-4 text-left">
                                    Atrasadas
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

                            {clientes.map((cliente) => (

                                <tr
                                    key={cliente.id}
                                    className="border-t"
                                >

                                    <td className="p-4 font-medium">

                                        {cliente.nome}

                                    </td>

                                    <td className="p-4">

                                        <div>

                                            <p>
                                                {cliente.telefone}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {cliente.email}
                                            </p>

                                        </div>

                                    </td>

                                    <td className="p-4">

                                        {cliente.cidade}

                                    </td>

                                    <td className="p-4 font-medium">

                                        R$ {Number(
                                            cliente.total_compras || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td className="p-4 text-green-600 font-medium">

                                        R$ {Number(
                                            cliente.total_pago || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td className="p-4 text-orange-500 font-medium">

                                        R$ {Number(
                                            cliente.total_aberto || 0
                                        ).toFixed(2)}

                                    </td>

                                    <td className="p-4">

                                        {cliente.parcelas_atrasadas}

                                    </td>

                                    <td className="p-4">

                                        {cliente.inadimplente ? (

                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">

                                                Inadimplente

                                            </span>

                                        ) : (

                                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">

                                                Adimplente

                                            </span>

                                        )}

                                    </td>

                                    <td className="p-4">

                                        <div className="flex gap-2">

                                            <button
                                                onClick={() =>
                                                    editarCliente(cliente)
                                                }
                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                                            >
                                                Editar
                                            </button>

                                            <a
                                                href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`}
                                                target="_blank"
                                                className="bg-green-600 text-white px-4 py-2 rounded-xl"
                                            >
                                                WhatsApp
                                            </a>

                                            <button
                                                onClick={() =>
                                                    excluirCliente(cliente.id)
                                                }
                                                className="bg-red-600 text-white px-4 py-2 rounded-xl"
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