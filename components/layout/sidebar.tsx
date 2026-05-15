"use client";

import Link from "next/link";

import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Wallet,
    FileText,
    Menu,
    DollarSign,
} from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
    {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/clientes",
        label: "Clientes",
        icon: Users,
    },
    {
        href: "/produtos",
        label: "Produtos",
        icon: Package,
    },
    {
        href: "/vendas",
        label: "Vendas",
        icon: ShoppingCart,
    },
    {
        href: "/contas-receber",
        label: "Contas a Receber",
        icon: Wallet,
    },
    {
        href: "/financeiro",
        label: "Financeiro",
        icon: DollarSign,
    },
    {
        href: "/relatorios",
        label: "Relatórios",
        icon: FileText,
    },
];

function SidebarContent() {

    return (

        <div className="h-full bg-black text-white p-6">

            <h1 className="text-3xl font-bold mb-10">

                Leport's ERP

            </h1>

            <nav className="flex flex-col gap-3">

                {menuItems.map((item) => {

                    const Icon = item.icon;

                    return (

                        <Link
                            key={item.href}
                            href={item.href}
                            className="
                                flex items-center gap-3
                                hover:bg-gray-800
                                p-3
                                rounded-xl
                                transition
                            "
                        >

                            <Icon size={18} />

                            {item.label}

                        </Link>

                    );
                })}

            </nav>

        </div>
    );
}

export default function Sidebar() {

    return (

        <>
            {/* DESKTOP */}

            <aside className="hidden md:flex w-64 h-screen sticky top-0">

                <SidebarContent />

            </aside>

            {/* MOBILE */}

            <div className="
                md:hidden
                fixed
                top-0
                left-0
                w-full
                bg-black
                text-white
                p-4
                flex
                items-center
                justify-between
                z-50
            ">

                <h1 className="font-bold">
                    Leport's ERP
                </h1>

                <Sheet>

                    <SheetTrigger>

                        <Menu />

                    </SheetTrigger>

                    <SheetContent
                        side="left"
                        className="p-0 w-72"
                    >

                        <SidebarContent />

                    </SheetContent>

                </Sheet>

            </div>
        </>
    );
}