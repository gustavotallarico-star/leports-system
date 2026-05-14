"use client";

import { Bell, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {

    const router = useRouter();

    const [menuAberto, setMenuAberto] = useState(false);

    async function sair() {

        await supabase.auth.signOut();

        router.push("/login");
    }

    return (

        <header className="h-20 bg-white border-b flex items-center justify-between px-8">

            <h1 className="text-3xl font-bold">
                Leport's ERP
            </h1>

            <div className="flex items-center gap-4 relative">

                {/* NOTIFICAÇÃO */}
                <button className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">

                    <Bell size={20} />

                </button>

                {/* USUÁRIO */}
                <button
                    onClick={() => setMenuAberto(!menuAberto)}
                    className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-2xl transition"
                >

                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold">

                        G

                    </div>

                    <div className="text-left">

                        <p className="font-semibold">
                            Gustavo
                        </p>

                        <p className="text-sm text-gray-500">
                            Administrador
                        </p>

                    </div>

                </button>

                {/* MENU */}
                {menuAberto && (

                    <div className="absolute top-16 right-0 bg-white shadow-2xl rounded-2xl w-56 border overflow-hidden z-50">

                        <button
                            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-100 transition"
                        >

                            <User size={18} />
                            Meu Perfil

                        </button>

                        <button
                            onClick={sair}
                            className="w-full px-5 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition"
                        >

                            <LogOut size={18} />
                            Sair da Conta

                        </button>

                    </div>

                )}

            </div>

        </header>
    );
}