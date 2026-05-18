"use client";

import Link from "next/link";

import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Wallet,
    FileText,
    DollarSign,
    Menu,
} from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

const menus = [
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

function SidebarLinks() {

    return (

        <nav className="flex flex-col gap-2 mt-10">

            {menus.map((menu) => {

                const Icon = menu.icon;

                return (

                    <Link
                        key={menu.href}
                        href={menu.href}
                        className="
                            flex
                            items-center
                            gap-3
                            p-3
                            rounded-xl
                            hover:bg-zinc-800
                            transition
                        "
                    >

                        <Icon size={20} />

                        <span>
                            {menu.label}
                        </span>

                    </Link>

                );
            })}

        </nav>
    );
}

export default function Sidebar() {

    return (

        <>
            {/* DESKTOP */}

            <aside className="
                hidden md:flex
                w-64
                h-screen
                bg-black
                text-white
                p-6
                flex-col
                sticky
                top-0
            ">

                <h1 className="text-3xl font-bold">
                    Leport's ERP
                </h1>

                <SidebarLinks />

            </aside>

            {/* MOBILE HEADER */}

            <header className="
                md:hidden
                fixed
                top-0
                left-0
                right-0
                h-16
                bg-black
                text-white
                flex
                items-center
                justify-between
                px-4
                z-50
            ">

                <h1 className="font-bold text-lg">
                    Leport's ERP
                </h1>

                <Sheet>

                    <SheetTrigger>

                        <Menu />

                    </SheetTrigger>

                    <SheetContent
                        side="left"
                        className="
                            bg-black
                            text-white
                            border-none
                            w-72
                            p-6
                        "
                    >

                        <h1 className="text-2xl font-bold">

                            Leport's ERP

                        </h1>

                        <SidebarLinks />

                    </SheetContent>

                </Sheet>

            </header>
        </>
    );
}