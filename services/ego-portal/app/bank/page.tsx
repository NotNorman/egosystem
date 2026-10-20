import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
    title: "Ego Banking - Coming Soon",
    description: "This feature is currently under development.",
};

const BankDashboard = () => {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-background p-8 text-foreground flex flex-col items-center justify-center transition-colors">
            
            <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-6">
                
                {/* Icon with pulsing background glow */}
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20 opacity-75"></div>
                    <Wrench className="w-8 h-8 relative z-10" />
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Work in Progress
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Ego Banking is <span className="text-emerald-600 dark:text-emerald-400">Cooking</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Balances, transfers, and deposit requests are currently being built. Check back soon!
                    </p>
                </div>

                {/* Back button */}
                <div className="pt-4">
                    <Link href="/">
                        <Button className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white cursor-pointer">
                            Back to Ego Hub
                        </Button>
                    </Link>
                </div>

            </div>

        </main>
    );
};

export default BankDashboard;