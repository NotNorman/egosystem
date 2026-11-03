// app/admin/bank/AdminBankClient.tsx
"use client";

import { useState } from "react";
import { Check, X, Clock, User } from "lucide-react";
import type { PendingDeposit } from "./page";

interface AdminBankClientProps {
    pendingRequests: PendingDeposit[];
    onProcessRequest: (id: number, status: "approved" | "rejected") => Promise<{ success: boolean; error?: string }>;
}

export default function AdminBankClient({ pendingRequests, onProcessRequest }: AdminBankClientProps) {
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleProcess = async (id: number, status: "approved" | "rejected") => {
        setProcessingId(id);
        try {
            const result = await onProcessRequest(id, status);
            if (!result.success) {
                alert(result.error);
            }
        } finally {
            setProcessingId(null);
        }
    };

    if (pendingRequests.length === 0) {
        return (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-bold text-foreground">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground mt-1">There are no pending deposit requests at this time.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pending Approvals ({pendingRequests.length})
                </h3>
            </div>
            
            <div className="divide-y divide-border">
                {pendingRequests.map((req) => (
                    <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/10 transition-colors">
                        
                        {/* User & Request Info */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-foreground">
                                    {req.user_name || "Unknown User"}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {req.user_email || "No email provided"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-mono text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
                                        #{req.id}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {req.description}
                                    </span>
                                    <span className="text-xs text-muted-foreground/50">•</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(req.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 md:pl-0 pl-14 w-full md:w-auto">
                            <div className="text-left sm:text-right">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Requested Amount</p>
                                <div className="font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                                    ◈ {req.amount.toLocaleString()}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleProcess(req.id, "rejected")}
                                    disabled={processingId === req.id}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    Decline
                                </button>
                                <button
                                    onClick={() => handleProcess(req.id, "approved")}
                                    disabled={processingId === req.id}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <Check className="w-4 h-4" />
                                    Approve
                                </button>
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}