// app/admin/bank/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import AdminBankClient from "./AdminBankClient";

export const metadata: Metadata = {
    title: "Bank Admin | Ego Fitness",
    description: "Review and manage pending ledger deposits.",
};

export interface PendingDeposit {
    id: number;
    amount: number;
    currency: string;
    description: string;
    created_at: Date;
    user_id: string;
    user_name: string | null;
    user_email: string | null;
}

async function AdminBankContent() {
    const session = await auth();

    // ==========================================
    // SECURITY: ADMIN CHECK
    // ==========================================
    // Replace this condition with your actual admin role check. 
    // For example: if (session?.user?.role !== 'admin')
   if (!session?.user?.id) {
        return (
            <div className="max-w-5xl mx-auto p-10 text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-2">Access Denied</h1>
                <p className="text-muted-foreground">You must be logged in to view this page.</p>
            </div>
        );
    }

    // Check the DB directly for real-time admin verification
    const adminResult = await pool.query(
        "SELECT is_admin FROM public.user_data WHERE id = $1",
        [session.user.id]
    );
    
    const isAdmin = adminResult.rows[0]?.is_admin === true;

    if (!isAdmin) {
        return (
            <div className="max-w-5xl mx-auto p-10 text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-2">Access Denied</h1>
                <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
            </div>
        );
    }

    // ==========================================
    // DATA FETCHING
    // ==========================================
    const result = await pool.query<PendingDeposit>(
        `SELECT l.id, l.amount, l.currency, l.description, l.created_at, l.user_id, u.username AS user_name, u.email AS user_email
         FROM public.ledger l
         LEFT JOIN public.user_data u ON l.user_id = u.id
         WHERE l.status = 'pending' AND l.transaction_type = 'deposit'
         ORDER BY l.created_at ASC`
    );

    // ==========================================
    // SERVER ACTIONS
    // ==========================================
    async function processDepositAction(transactionId: number, newStatus: "approved" | "rejected") {
        "use server";
        
        // 1. Verify Session
        const actionSession = await auth();
        if (!actionSession?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const client = await pool.connect();
        try {
            // 2. Strict Real-Time Admin Check
            const adminCheck = await client.query(
                "SELECT is_admin FROM public.user_data WHERE id = $1",
                [actionSession.user.id]
            );
            
            if (adminCheck.rows[0]?.is_admin !== true) {
                client.release();
                return { success: false, error: "Unauthorized: Admin access required." };
            }
            await client.query("BEGIN");
            
            // Only update if it is still pending
            const updateResult = await client.query(
                `UPDATE public.ledger 
                 SET status = $1 
                 WHERE id = $2 AND status = 'pending'
                 RETURNING id`,
                [newStatus, transactionId]
            );

            if (updateResult.rowCount === 0) {
                await client.query("ROLLBACK");
                return { success: false, error: "Request not found or already processed." };
            }

            await client.query("COMMIT");
            revalidatePath("/admin/bank");
            return { success: true };
        } catch (error) {
            await client.query("ROLLBACK");
            console.error(`Failed to ${newStatus} deposit:`, error);
            return { success: false, error: `Failed to ${newStatus} request.` };
        } finally {
            client.release();
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight">Bank Admin</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Review and process manual deposit requests from members.
                </p>
            </div>

            <AdminBankClient 
                pendingRequests={result.rows} 
                onProcessRequest={processDepositAction} 
            />
        </main>
    );
}

export default function AdminBankPage() {
    return (
        <Suspense fallback={
            <div className="max-w-5xl mx-auto p-10 text-center text-muted-foreground">
                Loading admin portal...
            </div>
        }>
            <AdminBankContent />
        </Suspense>
    );
}