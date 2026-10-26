// app/fitness/FitnessSubNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, BarChart3, CreditCard } from "lucide-react";

const fitnessNavItems = [
    {
        name: "Home",
        href: "/fitness",
        icon: Dumbbell,
        exact: true,
    },
    {
        name: "Membership",
        href: "/fitness/membership",
        icon: CreditCard,
        exact: false,
    },
    {
        name: "Stats & Leaderboards",
        href: "/fitness/stats",
        icon: BarChart3,
        exact: false,
    },

];

export default function FitnessSubNav() {
    const pathname = usePathname();

    return (
        <div className="w-full border-b border-border/60 bg-background/80 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center">
                <nav className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto max-w-full">
                    {fitnessNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                    isActive
                                        ? "bg-background text-foreground shadow-sm border border-border/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}