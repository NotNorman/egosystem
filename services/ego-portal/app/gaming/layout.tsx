// app/gaming/layout.tsx
import Link from "next/link";
import { Zap } from "lucide-react";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { UserMenu, LoginButton } from "@/components/NavBarClientLogic";
import { Suspense } from "react";

// 1. Dedicated async component to handle session and PostgreSQL ledger queries safely
async function GamingNavbarAuth() {
    const session = await auth();
    let currentUser = session?.user?.name || null;
    const userId = session?.user?.id || null;

    let balance = 0;

    if (userId) {
        try {
            const result = await pool.query(
                `SELECT 
                    username, 
                    (
                        SELECT COALESCE(SUM(amount), 0) 
                        FROM public.ledger 
                        WHERE user_id = $1 
                        AND currency = 'EGO' 
                        AND status = 'approved'
                    ) AS balance 
                FROM user_data 
                WHERE id = $1`,
                [userId]
            );
            if (result.rows[0]) {
                currentUser = result.rows[0].username;
                balance = Number(result.rows[0].balance ?? 0);
            }
        } catch (error) {
            console.error("Failed to fetch gaming navbar data:", error);
        }
    }

    const topUpPath = "/bank/portal?tab=deposit";
    const addBalanceHref = currentUser 
        ? topUpPath 
        : `/login?callbackUrl=${encodeURIComponent(topUpPath)}`;

    return (
        <div className="flex items-center gap-3">
            {/* Balance Display with Plus Link */}
            <div className="flex items-center h-8 sm:h-9 rounded-full border border-rose-900/50 bg-rose-500/10 overflow-hidden text-xs sm:text-sm font-medium shadow-[0_0_10px_rgba(244,63,94,0.2)] shrink-0 whitespace-nowrap">
                <span className="px-3 text-white tabular-nums flex items-center gap-1.5">
                    <span className="text-rose-500 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]">
                        ◈
                    </span>
                    <span className="font-mono font-bold">{balance.toLocaleString()}</span>
                </span>
                <Link
                    href={addBalanceHref}
                    title="Add Balance"
                    className="flex items-center justify-center h-full px-2.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-l border-rose-900/50 font-bold transition-colors"
                >
                    +
                </Link>
            </div>

            {/* Shared Client Auth Components */}
            {currentUser ? (
                <UserMenu username={currentUser} />
            ) : (
                <LoginButton />
            )}
        </div>
    );
}

// 2. Main Layout Component
export default function GamingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-50 font-sans selection:bg-rose-500/30 overflow-x-hidden">
            {/* GLOBAL GAMING NAVIGATION */}
            <header className="sticky top-0 z-50 w-full border-b border-rose-900/30 bg-[#0a0a0f]/80 backdrop-blur-md shadow-[0_4px_30px_rgba(225,29,72,0.1)]">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    
                    {/* Left: Logo Only */}
                    <div className="flex items-center gap-2">
                        <Link href="/gaming" className="flex items-center gap-2 group cursor-pointer">
                            <Zap className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse group-hover:scale-110 transition-transform" />
                            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                                EGO GAMING
                            </h1>
                        </Link>
                    </div>
                    
                    {/* Center Navigation Tabs */}
                    <nav className="hidden md:flex items-center gap-2 bg-[#12121a] p-1.5 rounded-full border border-rose-900/50 shadow-[0_0_15px_rgba(225,29,72,0.15)]">
                        {["Lottery", "Casino", "Arcade"].map((tab) => (
                            <Link 
                                key={tab} 
                                href={`/gaming/${tab.toLowerCase().replace(" ", "-")}`}
                                className="px-5 py-2 rounded-full text-sm font-bold text-slate-400 hover:text-rose-100 hover:bg-rose-950/50 hover:shadow-[0_0_10px_rgba(225,29,72,0.2)] transition-all duration-300"
                            >
                                {tab}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side wrapped in Suspense to satisfy Next.js prerendering */}
                    <Suspense fallback={
                        <div className="h-9 w-32 rounded-full bg-rose-500/10 border border-rose-900/50 animate-pulse" />
                    }>
                        <GamingNavbarAuth />
                    </Suspense>
                </div>
            </header>

            {children}
        </div>
    );
}