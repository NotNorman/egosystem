// app/gaming/layout.tsx
import Link from "next/link";
import { Zap } from "lucide-react";

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
                    {/* Clickable Logo */}
                    <Link href="/gaming" className="flex items-center gap-2 group cursor-pointer">
                        <Zap className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse group-hover:scale-110 transition-transform" />
                        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                            EGO GAMING
                        </h1>
                    </Link>
                    
                    <nav className="hidden md:flex items-center gap-2 bg-[#12121a] p-1.5 rounded-full border border-rose-900/50 shadow-[0_0_15px_rgba(225,29,72,0.15)]">
                        {["Lottery", "Casino", "Arcade", "Ego Sports"].map((tab) => (
                            <Link 
                                key={tab} 
                                href={`/gaming/category/${tab.toLowerCase().replace(" ", "-")}`}
                                className="px-5 py-2 rounded-full text-sm font-bold text-slate-400 hover:text-rose-100 hover:bg-rose-950/50 hover:shadow-[0_0_10px_rgba(225,29,72,0.2)] transition-all duration-300"
                            >
                                {tab}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                            <span className="text-rose-500 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]">◈</span>
                            {/* We'll make this balance dynamic later! */}
                            <span className="font-mono font-bold text-white">25,000</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* THIS RENDERS THE SPECIFIC PAGE CONTENT */}
            {children}
        </div>
    );
}