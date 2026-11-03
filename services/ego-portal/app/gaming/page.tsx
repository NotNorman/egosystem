// app/gaming/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Ticket, Dices, Gamepad2, Trophy, Coins, Zap, Timer } from "lucide-react";

export const metadata: Metadata = {
    title: "Ego Casino & Gaming",
    description: "Play, bet, and win Bank of Ego credits.",
};

// ==========================================
// 1. DATA MODELS
// ==========================================
const recentWinnings = [
    { id: 1, user: "Athlete_99", gameId: 3, game: "Neon Roulette", amount: 50000 },
    { id: 2, user: "IronLifter", gameId: 1, game: "Daily Powerball", amount: 250000 },
    { id: 3, user: "GymBro22", gameId: 5, game: "Ego Crash", amount: 12000 },
    { id: 4, user: "CardioQueen", gameId: 6, game: "Cyber Plinko", amount: 8500 },
    { id: 5, user: "SwoleMate", gameId: 4, game: "High-Roller Blackjack", amount: 40000 },
];

// Force the array to be super long so the loop never breaks even on 4k ultrawide screens
const extendedWinnings = [...recentWinnings, ...recentWinnings, ...recentWinnings];

const games = [
    { id: 1, name: "Daily Powerball", category: "Lottery", desc: "Draws every midnight. Massive jackpots.", icon: Ticket, color: "from-rose-500 to-pink-600", shadow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]" },
    { id: 2, name: "Weekly Mega Draw", category: "Lottery", desc: "The ultimate Ego payout.", icon: Trophy, color: "from-purple-500 to-fuchsia-600", shadow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]" },
    { id: 3, name: "Neon Roulette", category: "Casino", desc: "Spin the wheel, multiply your credits.", icon: Dices, color: "from-cyan-400 to-blue-500", shadow: "shadow-[0_0_30px_rgba(34,211,238,0.3)]" },
    { id: 4, name: "High-Roller Blackjack", category: "Casino", desc: "Beat the dealer.", icon: Coins, color: "from-amber-400 to-orange-500", shadow: "shadow-[0_0_30px_rgba(251,191,36,0.3)]" },
    { id: 5, name: "Ego Crash", category: "Arcade", desc: "Cash out before the multiplier crashes!", icon: Flame, color: "from-red-500 to-rose-600", shadow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]" },
    { id: 6, name: "Cyber Plinko", category: "Arcade", desc: "Drop the ball, hit the multipliers.", icon: Gamepad2, color: "from-violet-500 to-purple-600", shadow: "shadow-[0_0_30px_rgba(139,92,246,0.3)]" },
];

// ==========================================
// 2. MODULAR COMPONENTS
// ==========================================


function WinnersTicker() {
    return (
        <div className="w-full bg-[#12121a] border-b border-rose-900/20 overflow-hidden relative flex items-center h-14 group">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
            
            {/* Wrapper holding both tracks */}
            <div className="flex w-max">
                
                {/* TRACK 1 */}
                <div className="flex flex-nowrap shrink-0 animate-[marquee_80s_linear_infinite] group-hover:[animation-play-state:paused] items-center">
                    {extendedWinnings.map((win, i) => (
                        <div key={`track1-${i}`} className="flex items-center gap-2 text-sm px-8 shrink-0">
                            <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                            <span className="font-bold text-white">{win.user}</span>
                            <span className="text-slate-500">won</span>
                            <span className="font-mono font-bold text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]">
                                ◈ {win.amount.toLocaleString()}
                            </span>
                            <span className="text-slate-500">on</span>
                            <Link 
                                href={`/gaming/play/${win.gameId}`}
                                className="font-bold text-cyan-400 hover:text-cyan-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all cursor-pointer underline decoration-cyan-400/30 underline-offset-4 hover:scale-105 inline-block"
                            >
                                {win.game}
                            </Link>
                            <span className="ml-8 text-rose-900/50">✦</span>
                        </div>
                    ))}
                </div>
                
                {/* TRACK 2  */}
                <div className="flex flex-nowrap shrink-0 animate-[marquee_80s_linear_infinite] group-hover:[animation-play-state:paused] items-center" aria-hidden="true">
                    {extendedWinnings.map((win, i) => (
                        <div key={`track2-${i}`} className="flex items-center gap-2 text-sm px-8 shrink-0">
                            <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                            <span className="font-bold text-white">{win.user}</span>
                            <span className="text-slate-500">won</span>
                            <span className="font-mono font-bold text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]">
                                ◈ {win.amount.toLocaleString()}
                            </span>
                            <span className="text-slate-500">on</span>
                            <Link 
                                href={`/gaming/play/${win.gameId}`}
                                className="font-bold text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer underline decoration-cyan-400/30 underline-offset-4 hover:scale-105 inline-block"
                            >
                                {win.game}
                            </Link>
                            <span className="ml-8 text-rose-900/50">✦</span>
                        </div>
                    ))}
                </div>

            </div>
            
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        </div>
    );
}

function PromoBanner() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-4">
            <div className="relative rounded-3xl overflow-hidden bg-[#12121a] border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] min-h-[380px] flex items-center group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0f_20%,transparent),radial-gradient(circle_at_80%_50%,#312e81_0%,#0a0a0f_70%)] opacity-80" />
                <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 group-hover:bg-indigo-500/30 transition-colors duration-700" />

                <div className="relative z-10 p-8 md:p-16 w-full flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            <Timer className="w-4 h-4" /> Global Server Event
                        </div>
                        <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-2 drop-shadow-lg uppercase leading-none">
                            CYBER <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">HEIST</span>
                        </h2>
                        <p className="text-xl text-indigo-200/80 font-bold uppercase tracking-widest mb-6">
                            One Crew. One Vault. One Shot.
                        </p>
                    </div>

                    <div className="flex flex-col items-center bg-[#050508]/60 backdrop-blur-xl p-8 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                        <div className="text-xs font-bold tracking-widest text-indigo-400 mb-6 uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                            Event Ends In
                        </div>
                        
                        <div className="flex gap-4 md:gap-6 text-center mb-8">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">19</span>
                                <span className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest mt-1">DAYS</span>
                            </div>
                            <span className="text-3xl text-indigo-500/50 font-black pt-1">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">15</span>
                                <span className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest mt-1">HOURS</span>
                            </div>
                            <span className="text-3xl text-indigo-500/50 font-black pt-1">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">02</span>
                                <span className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest mt-1">MINUTES</span>
                            </div>
                        </div>

                        <button className="w-full py-4 rounded-xl bg-[#5952e6] hover:bg-[#6b64f5] text-white font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(89,82,230,0.4)] hover:shadow-[0_0_30px_rgba(89,82,230,0.6)] hover:-translate-y-1">
                            Check Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GamesGrid() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
            {Array.from(new Set(games.map(g => g.category))).map((category) => (
                <section key={category} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {category === "Lottery" && <Ticket className="text-rose-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]" />}
                            {category === "Casino" && <Dices className="text-cyan-400 w-8 h-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />}
                            {category === "Arcade" && <Gamepad2 className="text-purple-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />}
                            {category}
                        </h2>
                        <Link href={`/gaming/category/${category.toLowerCase()}`} className="text-sm font-bold text-rose-400 hover:text-rose-300 hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all">
                            View All →
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.filter(g => g.category === category).map((game) => (
                            <Link href={`/gaming/play/${game.id}`} key={game.id} className="group relative block h-full">
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${game.color} rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500`} />
                                <div className={`relative h-full p-6 rounded-2xl bg-[#12121a] border border-slate-800 group-hover:border-rose-500/50 transition-colors flex flex-col justify-between overflow-hidden ${game.shadow}`}>
                                    <game.icon className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-800/40 -rotate-12 group-hover:rotate-0 transition-transform duration-500 group-hover:scale-110" />
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg`}>
                                            <game.icon className="w-6 h-6 text-white drop-shadow-md" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-rose-100 transition-colors">
                                            {game.name}
                                        </h3>
                                        <p className="text-sm text-slate-400 font-medium">
                                            {game.desc}
                                        </p>
                                    </div>
                                    <div className="mt-8 relative z-10">
                                        <button className={`w-full py-3 rounded-xl bg-[#1a1a24] text-white font-bold text-sm group-hover:bg-gradient-to-r ${game.color} group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300`}>
                                            Play Now
                                        </button>
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
        <main className="min-h-screen bg-[#0a0a0f] text-slate-50 font-sans selection:bg-rose-500/30 overflow-x-hidden">
            <WinnersTicker />
            <PromoBanner />
            <GamesGrid />
            
            {/* Seamless 100% translation keyframe */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
            `}} />
        </main>
    );
}