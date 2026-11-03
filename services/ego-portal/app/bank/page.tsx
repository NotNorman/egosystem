import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Bank of Ego",
  description: "Dashboard for Bank of Ego services.",
};

const BankDashboard = () => {
    return (
        <main className="min-h-screen bg-background p-8 text-foreground flex flex-col items-center">

            {/* WIP Content */}
            <div className="flex flex-col items-center justify-center flex-1 text-center mt-20">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Home Page Work In Progress
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    This public landing page is currently under construction, but the secure online banking portal is fully functional.
                </p>
                <Link href="/bank/portal">
                    <Button className="font-semibold rounded-xl px-8 py-6 text-md">
                        Go to Online Banking
                    </Button>
                </Link>
            </div>

        </main>
    );
}

export default BankDashboard;