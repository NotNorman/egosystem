// app/gaming/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { 
    Flame, Ticket, Dices, Gamepad2, Trophy, Coins, 
    Zap, Timer, Sparkles, TrendingUp, Users, ArrowUpRight 
} from "lucide-react";

export const metadata: Metadata = {
    title: "Ego Casino & Gaming",
    description: "Play, bet, and win Bank of Ego credits.",
};

// ==========================================
// 1. DATA MODELS (RTP completely removed)
// ==========================================
const recentWinnings = [
    { id: 1, user: "Athlete_99", gameId: 3, game: "Neon Roulette", amount: 50000, mult: "12.5x", isHighRoller: false },
    { id: 2, user: "IronLifter", gameId: 1, game: "Daily Powerball", amount: 250000, mult: "JACKPOT", isHighRoller: true },
    { id: 3, user: "GymBro22", gameId: 5, game: "Ego Crash", amount: 12000, mult: "4.2x", isHighRoller: false },
    { id: 4, user: "CardioQueen", gameId: 6, game: "Cyber Plinko", amount: 8500, mult: "8.0x", isHighRoller: false },
    { id: 5, user: "SwoleMate", gameId: 4, game: "High-Roller Blackjack", amount: 40000, mult: "2.5x", isHighRoller: true },
];

const extendedWinnings = [...recentWinnings, ...recentWinnings, ...recentWinnings];

const games = [
    { 
        id: 1, 
        name: "Daily Powerball", 
        category: "Lottery", 
        desc: "Draws every midnight. Massive jackpots.", 
        icon: Ticket, 
        color: "from-rose-500 via-pink-600 to-rose-600", 
        accent: "text-rose-400",
        borderGlow: "group-hover:border-rose-500/60",
        shadow: "group-hover:shadow-[0_0_40px_-5px_rgba(244,63,94,0.4)]",
        badge: "HOT",
        maxWin: "◈ 1,000,000",
        players: 412
    },
    { 
        id: 2, 
        name: "Weekly Mega Draw", 
        category: "Lottery", 
        desc: "The ultimate Ego payout.", 
        icon: Trophy, 
        color: "from-purple-500 via-fuchsia-600 to-purple-600", 
        accent: "text-purple-400",
        borderGlow: "group-hover:border-purple-500/60",
        shadow: "group-hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.4)]",
        badge: "JACKPOT",
        maxWin: "◈ 5,000,000",
        players: 890
    },
    { 
        id: 3, 
        name: "Neon Roulette", 
        category: "Casino", 
        desc: "Spin the wheel, multiply your credits.", 
        icon: Dices, 
        color: "from-cyan-400 via-blue-500 to-indigo-600", 
        accent: "text-cyan-400",
        borderGlow: "group-hover:border-cyan-400/60",
        shadow: "group-hover:shadow-[0_0_40px_-5px_rgba(34,211,238,0.4)]",
        badge: "POPULAR",
        maxWin: "36x",
        players: 128
    },
    { 
        id: 4, 
        name: "High-Roller Blackjack", 
        category: "Casino", 
        desc: "Beat the dealer in 21.", 
        icon: Coins, 
        color: "from-amber-400 via-orange-500 to-red-500", 
        accent: "text-amber-400",
        borderGlow: "group-hover:border-amber-400/60",
        shadow: "group-hover:shadow-[0_0_40px_-5px_rgba(251,191,36,0.4)]",
        badge: "VIP",
        maxWin: "10x",
        players: 64
    },
    { 
        id: 5, 
        name: "Ego Crash", 
        category: "Arcade", 
        desc: "Cash out before the multiplier crashes!", 
        icon: Flame, 
        color: "from-red-500 via-rose-600 to-orange-600", 
        accent: "text-red-400",
        borderGlow: "group-hover:border-red-500/60",
        shadow: "group-hover:shadow-[0_0_40px_-5px_rgba(239,68,68,0.4)]",
        badge: "LIVE",
        maxWin: "1,000x",
        players: 315
    },
    { 
        id: 6, 
        name: "Cyber Plinko", 
        category: "Arcade", 
        desc: "Drop the ball, hit the multipliers.", 
        icon: Gamepad2, 
        color: "from-violet-500 via-purple-600 to-indigo-600", 
        accent: "text-violet-400",
        borderGlow: "group-hover:border-violet-500/60",
        shadow: "group-hover:shadow-[0_0_40px_-5px_rgba(139,92,246,0.4)]",
        badge: null,
        maxWin: "555x",
        players: 194
    },
];

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
                href={`/gaming/play/${win.gameId}`}
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
                    <span className="text-[11px] font-black tracking-widest uppercase text-rose-400">
                        Live Feed
                    </span>
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
            <div className="relative rounded-3xl overflow-hidden bg-[#0e0e16] border border-indigo-500/30 shadow-[0_0_60px_-15px_rgba(99,102,241,0.3)] min-h-[420px] flex items-center group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#312e81_0%,transparent_50%),radial-gradient(circle_at_20%_80%,#881337_0%,transparent_50%)] opacity-60" />
                <div 
                    className="absolute inset-0 opacity-[0.12]" 
                    style={{
                        backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
                        backgroundSize: '3rem 3rem',
                        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)'
                    }}
                />

                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-[110px] animate-pulse pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-500/25 rounded-full blur-[110px] group-hover:bg-indigo-400/35 transition-colors duration-700 pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

                <div className="relative z-10 p-6 sm:p-10 md:p-14 w-full flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center lg:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold tracking-widest uppercase shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} /> 
                            Global Server Event
                        </div>

                        <div>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.9] drop-shadow-2xl">
                                CYBER <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                                    HEIST
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg text-indigo-200/80 font-bold uppercase tracking-[0.2em] mt-3">
                                One Crew. One Vault. One Shot.
                            </p>
                        </div>

                        <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-4 rounded-2xl bg-[#07070c]/80 border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Vault Pool</div>
                                    <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                                        ◈ 10,500,000
                                    </div>
                                </div>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-white/10" />
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                <TrendingUp className="w-4 h-4" />
                                +◈ 42.5k / hr
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-sm flex flex-col items-center bg-[#08080e]/85 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
                        
                        <div className="text-xs font-extrabold tracking-widest text-indigo-300 mb-5 uppercase flex items-center gap-2">
                            <Timer className="w-4 h-4 text-rose-400 animate-bounce" />
                            Vault Locks In
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 w-full mb-7">
                            {[
                                { val: "19", label: "DAYS" },
                                { val: "15", label: "HOURS" },
                                { val: "02", label: "MINS" },
                            ].map((unit, idx) => (
                                <div key={idx} className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 shadow-inner">
                                    <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                                        {unit.val}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-extrabold tracking-widest mt-1">
                                        {unit.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button className="group/btn relative w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] hover:-translate-y-0.5 active:translate-y-0 overflow-hidden cursor-pointer">
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                            <span className="relative flex items-center justify-center gap-2">
                                Enter The Heist
                                <Zap className="w-4 h-4 fill-current" />
                            </span>
                        </button>

                        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span><strong className="text-white">1,420</strong> athletes registered</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GamesGrid() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16 relative z-10">
            {Array.from(new Set(games.map(g => g.category))).map((category) => (
                <section key={category} className="space-y-6">
                    <div className="flex items-end justify-between border-b border-white/[0.07] pb-4">
                        <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-2xl border ${
                                category === "Lottery" ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]" :
                                category === "Casino" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]" :
                                "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                            }`}>
                                {category === "Lottery" && <Ticket className="w-6 h-6" />}
                                {category === "Casino" && <Dices className="w-6 h-6" />}
                                {category === "Arcade" && <Gamepad2 className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                                    {category}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    {category === "Lottery" && "High-upside scheduled draws"}
                                    {category === "Casino" && "Provably fair house classics"}
                                    {category === "Arcade" && "Fast-paced instant multiplier games"}
                                </p>
                            </div>
                        </div>
                        <Link 
                            href={`/gaming/category/${category.toLowerCase()}`} 
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-bold text-slate-300 hover:text-white transition-all"
                        >
                            View All
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.filter(g => g.category === category).map((game) => (
                            <Link 
                                href={`/gaming/play/${game.id}`} 
                                key={game.id} 
                                className="group relative block h-full rounded-3xl transition-all duration-300 hover:-translate-y-1.5"
                            >
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${game.color} rounded-3xl blur-md opacity-0 group-hover:opacity-40 transition duration-500`} />
                                
                                <div className={`relative h-full p-6 rounded-3xl bg-[#101018] border border-white/[0.08] ${game.borderGlow} ${game.shadow} transition-all duration-300 flex flex-col justify-between overflow-hidden`}>
                                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <game.icon className="absolute -right-8 -bottom-8 w-40 h-40 text-white/[0.02] group-hover:text-white/[0.05] -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

                                    <div>
                                        <div className="flex items-start justify-between gap-4 mb-5">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                                <div className="w-full h-full bg-[#101018]/40 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
                                                    <game.icon className="w-7 h-7 text-white drop-shadow" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] font-semibold text-slate-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    {game.players}
                                                </div>

                                                {game.badge && (
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                        game.badge === "HOT" || game.badge === "LIVE" 
                                                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30" 
                                                            : game.badge === "JACKPOT"
                                                            ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                                    }`}>
                                                        {game.badge}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-extrabold text-white mb-1.5 group-hover:text-white transition-colors">
                                            {game.name}
                                        </h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {game.desc}
                                        </p>
                                    </div>

                                    {/* Card Footer: Cleaned up with only Max Win and Action Button */}
                                    <div className="mt-7 pt-4 border-t border-white/[0.06] space-y-4 relative z-10">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-medium">Potential Payout</span>
                                            <span className="text-slate-400 font-medium">
                                                Max Win <strong className={`font-mono font-bold ${game.accent}`}>{game.maxWin}</strong>
                                            </span>
                                        </div>

                                        <div className={`w-full py-3 px-4 rounded-xl bg-white/[0.05] group-hover:bg-gradient-to-r ${game.color} text-white font-bold text-sm transition-all duration-300 flex items-center justify-between shadow-inner`}>
                                            <span>Play Now</span>
                                            <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

// ==========================================
// 3. MAIN PAGE LAYOUT
// ==========================================

export default function GamingPortal() {
    return (
        <main className="min-h-screen bg-[#07070a] text-slate-50 font-sans selection:bg-rose-500/30 overflow-x-hidden relative">
            <div className="fixed top-1/4 -left-64 w-96 h-96 bg-rose-600/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="fixed bottom-1/4 -right-64 w-96 h-96 bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

            <WinnersTicker />
            <PromoBanner />
            <GamesGrid />
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </main>
    );
}