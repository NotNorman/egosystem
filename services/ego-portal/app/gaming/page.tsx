// app/gaming/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { 
    Flame, Ticket, Dices, Gamepad2, Trophy, Coins, 
    Zap, Timer, Sparkles, TrendingUp, Users, ArrowUpRight, Bomb
} from "lucide-react";
import { pool } from "@/lib/db"; 
import { Suspense } from "react";


export const metadata: Metadata = {
    title: "Ego Casino & Gaming",
    description: "Play, bet, and win Bank of Ego credits.",
};

// ==========================================
// 1. TYPES & DATA FETCHING
// ==========================================
interface Game {
    id: number;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    icon_url: string | null;
    hex_colour: string;
    category: string;
    badge: string | null;
    is_active: boolean;
}

const categoryStyles: Record<string, string> = {
    lottery: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    casino: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
    arcade: "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
};

const categoryDescriptions: Record<string, string> = {
    lottery: "High-upside scheduled draws",
    casino: "Provably fair house classics",
    arcade: "Fast-paced instant multiplier games"
};

const categoryOrder = ["lottery", "casino", "arcade"];

// Badge color, different from the game's hex_color
const getBadgeStyle = (badgeText: string) => {
    switch (badgeText?.toUpperCase()) {
        case "HOT":
        case "LIVE":
            return "bg-rose-500/15 text-rose-400 border-rose-500/30";
        case "JACKPOT":
            return "bg-amber-500/15 text-amber-400 border-amber-500/30";
        case "NEW":
            return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
        case "VIP":
            return "bg-purple-500/15 text-purple-400 border-purple-500/30";
        case "POPULAR":
            return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
        case "EVENT":
            return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
        default:
            return "bg-white/10 text-white border-white/20";
    }
};

// Mocking the live feed for now until casino_bets table is wired up
const recentWinnings = [
    { id: 1, user: "Athlete_99", gameId: 3, game: "Egolette", amount: 50000, mult: "12.5x", isHighRoller: false },
    { id: 2, user: "IronLifter", gameId: 1, game: "Ego Max", amount: 250000, mult: "JACKPOT", isHighRoller: true },
    { id: 3, user: "GymBro22", gameId: 5, game: "Vertego", amount: 12000, mult: "4.2x", isHighRoller: false },
    { id: 4, user: "CardioQueen", gameId: 6, game: "Plinkego", amount: 8500, mult: "8.0x", isHighRoller: false },
];
const extendedWinnings = [...recentWinnings, ...recentWinnings, ...recentWinnings];

// Map database categories to fallback Lucide icons
const categoryIcons: Record<string, any> = {
    lottery: Ticket,
    casino: Dices,
    arcade: Bomb
};

// ==========================================
// 2. MODULAR COMPONENTS
// ==========================================

function WinnersTicker() {
    const renderTrackItem = (win: typeof recentWinnings[0], keyPrefix: string, index: number) => (
        <div 
            key={`${keyPrefix}-${index}`} 
            className="flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-full bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06] transition-all shrink-0 text-xs backdrop-blur-md"
        >
            <span className={`p-1 rounded-full ${win.isHighRoller ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"}`}>
                <Trophy className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-slate-200">{win.user}</span>
            <span className="text-slate-500">hit</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] font-bold text-slate-300 border border-white/5">
                {win.mult}
            </span>
            <span className={`font-mono font-black ${win.isHighRoller ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-emerald-400"}`}>
                +◈ {win.amount.toLocaleString()}
            </span>
            <span className="text-slate-600">•</span>
            <Link 
                href={`/gaming/${win.gameId}`}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-0.5 group/link"
            >
                {win.game}
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </Link>
        </div>
    );

    return (
        <div className="w-full bg-[#08080c]/90 border-b border-white/[0.06] overflow-hidden relative flex items-center h-14 group z-20 backdrop-blur-lg">
            <div className="relative z-20 flex items-center gap-2.5 pl-4 pr-6 h-full bg-gradient-to-r from-[#08080c] via-[#08080c] to-transparent shrink-0">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <span className="text-[11px] font-black tracking-widest uppercase text-rose-400">Live Feed</span>
                </div>
            </div>
            <div className="flex w-max">
                <div className="flex flex-nowrap shrink-0 animate-[marquee_70s_linear_infinite] group-hover:[animation-play-state:paused] items-center">
                    {extendedWinnings.map((win, i) => renderTrackItem(win, "t1", i))}
                </div>
                <div className="flex flex-nowrap shrink-0 animate-[marquee_70s_linear_infinite] group-hover:[animation-play-state:paused] items-center" aria-hidden="true">
                    {extendedWinnings.map((win, i) => renderTrackItem(win, "t2", i))}
                </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#07070a] to-transparent z-10 pointer-events-none" />
        </div>
    );
}

function PromoBanner() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-4 relative z-10">
            {/* Kept your exact PromoBanner design intact */}
            <div className="relative rounded-3xl overflow-hidden bg-[#0e0e16] border border-indigo-500/30 shadow-[0_0_60px_-15px_rgba(99,102,241,0.3)] min-h-[420px] flex items-center group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#312e81_0%,transparent_50%),radial-gradient(circle_at_20%_80%,#881337_0%,transparent_50%)] opacity-60" />
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-[110px] animate-pulse pointer-events-none" />
                
                <div className="relative z-10 p-6 sm:p-10 md:p-14 w-full flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center lg:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold tracking-widest uppercase shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} /> 
                            Global Server Event
                        </div>
                        <div>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.9] drop-shadow-2xl">
                                CYBER <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">HEIST</span>
                            </h1>
                        </div>
                        <button className="relative py-4 px-8 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white font-black text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                            Enter The Heist <Zap className="inline w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 2. Replace your GamesGrid with this:
function GamesGrid({ games }: { games: Game[] }) {
    const categories = Array.from(new Set(games.map(g => g.category)))
        .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16 relative z-10">
            {categories.map((category) => {
                const CategoryIcon = categoryIcons[category.toLowerCase()] || Dices;
                
                return (
                    <section key={category} className="space-y-6">
                        {/* Restored Category Header with Colors and View All Button */}
                        <div className="flex items-end justify-between border-b border-white/[0.07] pb-4">
                            <div className="flex items-center gap-3.5">
                                <div className={`p-2.5 rounded-2xl border ${categoryStyles[category] || "bg-white/5 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"}`}>
                                    <CategoryIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                                        {category}
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        {categoryDescriptions[category] || ""}
                                    </p>
                                </div>
                            </div>
                            <Link 
                                href={`/gaming/${category.toLowerCase()}`} 
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-bold text-slate-300 hover:text-white transition-all"
                            >
                                View All
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.filter(g => g.category === category).map((game) => {
                                const FallbackIcon = categoryIcons[game.category.toLowerCase()] || Dices;
                                
                                return (
                                    <Link 
                                        href={`/gaming/${game.slug}`} 
                                        key={game.id} 
                                        style={{ "--game-color": game.hex_colour } as React.CSSProperties}
                                        className="group relative flex flex-col bg-[#13131a] rounded-2xl overflow-hidden border border-white/5 hover:border-[var(--game-color)] transition-colors duration-300 shadow-lg hover:shadow-[0_0_30px_-10px_var(--game-color)]"
                                    >
                                        <div className="relative w-full h-32 sm:h-40">
                                            {game.image_url ? (
                                                <Image 
                                                    src={game.image_url} 
                                                    alt={game.name} 
                                                    fill 
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#1c1c24]" />
                                            )}
                                            
                                            <div className="absolute top-3 w-full px-3 flex justify-between items-start z-10">
                                                <div className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                                                    {game.icon_url ? (
                                                        <Image src={game.icon_url} alt="icon" width={24} height={24} className="w-6 h-6 object-contain" />
                                                    ) : (
                                                        <FallbackIcon className="w-6 h-6" style={{ color: game.hex_colour }} />
                                                    )}
                                                </div>

                                                {/* Restored Independent Badge Colors */}
                                                {game.badge && (
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getBadgeStyle(game.badge)}`}>
                                                        {game.badge}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#13131a] to-transparent" />
                                        </div>

                                        <div className="p-5 flex flex-col flex-grow z-10">
                                            <h3 className="text-xl font-extrabold text-white mb-1">{game.name}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2">{game.description}</p>

                                            <div className="mt-auto border-t border-white/[0.06] pt-4">
                                                <div className="w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white font-bold text-sm transition-all duration-300 flex items-center justify-between shadow-inner">
                                                    <span>Play Now</span>
                                                    <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

// fetch games from the database and pass them to the GamesGrid component
async function GamesFetcher() {
    const result = await pool.query("SELECT * FROM public.games WHERE is_active = true ORDER BY category, id");
    
    // It passes the data directly into your existing GamesGrid
    return <GamesGrid games={result.rows} />;
}

// ==========================================
// 3. MAIN PAGE LAYOUT (Server Component)
// ==========================================

export default function GamingPortal() {
    return (
        <main className="min-h-screen bg-[#07070a] text-slate-50 font-sans overflow-x-hidden relative">
            <div className="fixed top-1/4 -left-64 w-96 h-96 bg-rose-600/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="fixed bottom-1/4 -right-64 w-96 h-96 bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

            <WinnersTicker />
            <PromoBanner />
            
            {/* 3. Wrap the database fetcher in a Suspense boundary */}
            <Suspense fallback={
                <div className="w-full py-32 flex justify-center items-center">
                    <div className="text-indigo-400/80 font-bold uppercase tracking-widest animate-pulse flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                        Connecting to Ego Server...
                    </div>
                </div>
            }>
                <GamesFetcher />
            </Suspense>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
            `}} />
        </main>
    );
}