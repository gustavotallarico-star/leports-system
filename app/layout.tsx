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

                <div className="flex">

                    <Sidebar />

                    <div className="flex-1 min-h-screen">

                        <Header />

                        <main className="p-8">

                            {children}

                        </main>

                    </div>

                </div>

            </body>

        </html>
    );
}