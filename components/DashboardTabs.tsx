"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
    { href: "/dashboard", label: "Games" },
    { href: "/stats", label: "Stats" }
];

export default function DashboardTabs() {
    const pathname = usePathname();

    return (
        <nav aria-label="Primary navigation" className="flex gap-1">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                            isActive
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
