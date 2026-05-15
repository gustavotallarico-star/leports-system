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

            <body className="bg-gray-100">

                <div className="flex">

                    <Sidebar />

                    <main className="
                        flex-1
                        min-h-screen
                        p-4
                        md:p-8
                        mt-16
                        md:mt-0
                    ">

                        {children}

                    </main>

                </div>

            </body>

        </html>
    );
}