"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {

    const router = useRouter();

    const [email, setEmail] =
        useState("");

    const [senha, setSenha] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function login() {

        setLoading(true);

        const { error } =
            await supabase.auth.signInWithPassword({
                email,
                password: senha,
            });

        setLoading(false);

        if (error) {

            alert(error.message);

            return;
        }

        router.push("/");
    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">

            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl">

                <h1 className="text-3xl font-bold mb-2">
                    Leport's ERP
                </h1>

                <p className="text-gray-500 mb-8">
                    Faça login para continuar
                </p>

                <div className="space-y-4">

                    <input
                        type="email"
                        placeholder="Seu email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        className="w-full border p-3 rounded-xl"
                    />

                    <input
                        type="password"
                        placeholder="Sua senha"
                        value={senha}
                        onChange={(e) =>
                            setSenha(e.target.value)
                        }
                        className="w-full border p-3 rounded-xl"
                    />

                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full bg-black text-white p-3 rounded-xl"
                    >

                        {loading
                            ? "Entrando..."
                            : "Entrar"}

                    </button>

                </div>

            </div>

        </div>
    );
}