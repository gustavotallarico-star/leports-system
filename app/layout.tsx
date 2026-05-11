import "./globals.css";
import Sidebar from "@/components/layout/sidebar";

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

            <body>

                <div className="flex">

                    <Sidebar />

                    <main className="flex-1">

                        {children}

                    </main>

                </div>

            </body>

        </html>
    );
}