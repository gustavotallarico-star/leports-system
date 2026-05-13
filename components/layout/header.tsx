"use client";

export default function Header() {

    return (

        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">

            <div>

                <h1 className="text-xl font-bold">
                    Leport's ERP
                </h1>

            </div>

            <div className="flex items-center gap-4">

                <button className="bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition">
                    🔔
                </button>

                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                        G
                    </div>

                    <div>

                        <p className="font-semibold text-sm">
                            Gustavo
                        </p>

                        <p className="text-xs text-gray-500">
                            Administrador
                        </p>

                    </div>

                </div>

            </div>

        </header>
    );
}