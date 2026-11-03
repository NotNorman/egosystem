// app/bank/portal/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import PortalClient from "./PortalClient";
import { ArrowRight, Wallet, History, Crown, PlusCircle } from "lucide-react";
import { connection } from "next/server";


export const metadata: Metadata = {
    title: "Online Banking | Ego Fitness",
    description: "Manage your Bank of Ego credits, bonuses, and memberships.",
};

export interface DashboardBalances {
    direct: number;
    bonus: number;
}

export interface LedgerTransaction {
    id: number;
    amount: number;
    currency: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
    transaction_type: "deposit" | "withdrawl" | "purchase" | "transfer";
    description: string;
    created_at: Date;
}

export interface ActiveMembership {
    id: number;
    name: string;
    description: string;
    current_period_end: Date;
}

async function OnlineBankingContent() {
    await connection();
    const session = await auth();
    // ==========================================
    // GUEST VIEW (Unauthenticated)
    // ==========================================
    if (!session?.user?.id) {
        return (
            <div className="max-w-5xl mx-auto p-6 md:p-10">
                {/* Hero Banner */}
                <div className="text-center max-w-2xl mx-auto mb-16 pt-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Your Ego Financial Hub
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        The Bank of Ego portal is your all-in-one dashboard to manage your fitness finances. View balances, top up credits, track earned workout bonuses, and manage your active facility memberships.
                    </p>
                    <Link
                        href={`/login?callbackUrl=${encodeURIComponent("/bank/portal")}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                        <span>Sign In to Get Started</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                {/* 4 Informational Grid Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: "Review Balances", desc: "Instantly check your direct deposit credits and earned workout bonuses.", icon: Wallet },
                        { title: "Top-Up & Deposit", desc: "Request deposits to add funds to your account securely.", icon: PlusCircle },
                        { title: "Transaction History", desc: "Monitor all your activity, including pending approvals and past purchases.", icon: History },
                        { title: "Manage Memberships", desc: "View your active Ego Fitness tiers, perks, and upcoming renewal dates.", icon: Crown },
                    ].map((feature, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-1 text-lg">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ==========================================
    // AUTHENTICATED VIEW (Fetch Dashboard Data)
    // ==========================================
    const userId = session.user.id;

    const balancesResult = await pool.query(
        `SELECT currency, COALESCE(SUM(amount), 0) AS total 
         FROM public.ledger 
         WHERE user_id = $1 AND status = 'approved'
         GROUP BY currency`,
        [userId]
    );
    
    const balances: DashboardBalances = { direct: 0, bonus: 0 };
    balancesResult.rows.forEach(row => {
        if (row.currency === 'EGO') balances.direct = Number(row.total);
        if (row.currency === 'BONUS') balances.bonus = Number(row.total);
    });

    const historyResult = await pool.query<LedgerTransaction>(
        `SELECT id, amount, currency, status, description, transaction_type, created_at 
         FROM public.ledger 
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    const membershipsResult = await pool.query<ActiveMembership>(
        `SELECT s.id, p.name, p.description, s.current_period_end 
         FROM public.subscriptions s
         JOIN public.products p ON s.product_id = p.id
         WHERE s.user_id = $1 AND s.status = 'active'`,
        [userId]
    );

    // 1. ADD THIS LINE: Determine if the user currently has an active pending deposit
    const hasPendingDeposit = historyResult.rows.some(
        tx => tx.status === 'pending' && tx.transaction_type === 'deposit'
    );

    // ACTION: Request Deposit
    async function requestDepositAction(amount: number) {
        "use server";
        
        // Calculate the dollar amount and format it as a currency string (e.g., "$50.00")
        const dollarAmount = (amount / 1000).toLocaleString("en-US", {
            style: "currency",
            currency: "USD"
        });
        
        const description = `Manual deposit request (${dollarAmount})`;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 2. ADD THIS STRICT BACKEND CHECK: Ensure no pending deposits exist for this user
            const checkResult = await client.query(
                `SELECT id FROM public.ledger 
                 WHERE user_id = $1 AND status = 'pending' AND transaction_type = 'deposit'`,
                [userId]
            );

            if ((checkResult.rowCount ?? 0) > 0) {
                await client.query("ROLLBACK");
                return { 
                    success: false, 
                    error: "You already have a pending deposit request. Please cancel it or wait for approval." 
                };
            }

            await client.query(
                `INSERT INTO public.ledger (user_id, amount, currency, status, description, transaction_type, merchant_id)
                 VALUES ($1, $2, 'EGO', 'pending', $3, 'deposit', 1)`,
                [userId, amount, description]
            );
            await client.query("COMMIT");
            revalidatePath("/bank/portal");
            return { success: true };
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Failed to request deposit:", error);
            return { success: false, error: "Failed to submit deposit request." };
        } finally {
            client.release();
        }
    }

    // ACTION: Cancel Pending Transaction
    async function cancelTransactionAction(transactionId: number) {
        "use server";
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            
            // Only allow canceling if it belongs to the user and is still 'pending'
            const result = await client.query(
                `UPDATE public.ledger 
                 SET status = 'cancelled' 
                 WHERE id = $1 AND user_id = $2 AND status = 'pending'
                 RETURNING id`,
                [transactionId, userId]
            );

            if (result.rowCount === 0) {
                await client.query("ROLLBACK");
                return { success: false, error: "Could not cancel. The request may have already been processed." };
            }

            await client.query("COMMIT");
            revalidatePath("/bank/portal");
            return { success: true };
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Failed to cancel transaction:", error);
            return { success: false, error: "Failed to cancel transaction." };
        } finally {
            client.release();
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {session.user.name || "Athlete"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your finances, memberships, and transaction history.
                </p>
            </div>

            <PortalClient 
                balances={balances}
                transactions={historyResult.rows}
                memberships={membershipsResult.rows}
                hasPendingDeposit={hasPendingDeposit} // 3. ADD THIS PROP HERE
                onRequestDeposit={requestDepositAction}
                onCancelTransaction={cancelTransactionAction}
            />
        </main>
    );
}

export default function OnlineBankingPage() {
    return (
        <Suspense fallback={
            <div className="max-w-5xl mx-auto p-10 text-center text-muted-foreground">
                Loading banking portal...
            </div>
        }>
            <OnlineBankingContent />
        </Suspense>
    );
}