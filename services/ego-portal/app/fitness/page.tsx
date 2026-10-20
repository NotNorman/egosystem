import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Ego Fitness",
  description: "Dashboard for Ego Fitness service.",
};

const FitnessDashboard = () => {
    return (
        <main className="min-h-screen bg-background p-8 text-foreground flex flex-col items-center">
            
            {/* Header Section */}
            <div className="flex w-full max-w-5xl items-center justify-between mb-8 pb-6 border-b border-border">
                <h1 className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">
                    Ego Fitness
                </h1>
                
                <Link href="/">
                    <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                        Back to Ego Hub
                    </Button>
                </Link>
            </div>

        </main>
    );
}

export default FitnessDashboard;