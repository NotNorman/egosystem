// app/bank/top-up/page.tsx
import { Suspense } from "react";
import { requireAuth } from "@/lib/requireAuth";

// 1. Inner async component: [Feature]Content
const TopUpContent = async () => {
    const { userId, username } = await requireAuth("/bank/top-up");

    return (
        <div>
            <h1 className="text-2xl font-bold">Top Up Balance</h1>
            <p className="text-sm text-muted-foreground">
                Logged in as {username} (ID: {userId})
            </p>
        </div>
    );
};

// 2. Main default export: [Feature]Page
const TopUpPage = () => {
    return (
        <main className="p-8">
            <Suspense fallback={<div>Loading...</div>}>
                <TopUpContent />
            </Suspense>
        </main>
    );
};

export default TopUpPage;