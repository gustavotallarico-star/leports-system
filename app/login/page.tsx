"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [loading, setLoading] = useState(false);

    const [erro, setErro] = useState("");

    useEffect(() => {

        verificarLogin();

    }, []);

    async function verificarLogin() {

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session) {

            router.push("/");
        }
    }

    async function login() {

        try {

            setLoading(true);

            setErro("");

            const { error } =
                await supabase.auth.signInWithPassword({
                    email,
                    password: senha,
                });

            if (error) {

                setErro("Email ou senha inválidos");

                return;
            }

            router.push("/");

        } catch (error) {

            setErro("Erro ao fazer login");

        } finally {

            setLoading(false);
        }
    }

    return (

        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-6">

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">

                <div className="flex justify-center mb-6">

                    <div className="w-20 h-20 rounded-3xl bg-black text-white flex items-center justify-center">

                        <LogIn size={36} />

                    </div>

                </div>

                <h1 className="text-4xl font-bold text-center mb-2">

                    Leport's ERP

                </h1>

                <p className="text-gray-500 text-center mb-8">

                    Faça login para acessar o sistema

                </p>

                {erro && (

                    <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm">

                        {erro}

                    </div>

                )}

                <div className="space-y-4">

                    <input
                        type="email"
                        placeholder="Seu email"
                        value={email}
                        disabled={loading}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {

                                login();
                            }
                        }}
                        className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    <input
                        type="password"
                        placeholder="Sua senha"
                        value={senha}
                        disabled={loading}
                        onChange={(e) =>
                            setSenha(e.target.value)
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {

                                login();
                            }
                        }}
                        className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full bg-black hover:bg-gray-800 transition text-white p-4 rounded-2xl font-semibold"
                    >

                        {loading
                            ? "Entrando..."
                            : "Entrar no Sistema"}

                    </button>

                </div>

            </div>

        </div>
    );
}