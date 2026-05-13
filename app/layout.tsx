import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export const metadata = {
    title: "Leport's ERP",
    description: "Sistema Administrativo",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (

        <html lang="pt-BR">

            <body className="bg-gray-100">

                <div className="flex h-screen overflow-hidden">

                    {/* SIDEBAR */}
                    <Sidebar />

                    {/* CONTEÚDO */}
                    <div className="flex flex-col flex-1 overflow-hidden">

                        {/* HEADER */}
                        <Header />

                        {/* PÁGINAS */}
                        <main className="flex-1 overflow-y-auto p-6">

                            <div className="max-w-7xl mx-auto">

                                {children}

                            </div>

                        </main>

                    </div>

                </div>

            </body>

        </html>
    );
}