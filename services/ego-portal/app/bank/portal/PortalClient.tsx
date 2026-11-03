// app/bank/portal/PortalClient.tsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
    Wallet, PlusCircle, History, Crown, 
    CheckCircle2, XCircle, Clock, Zap, Ban, Filter, Search 
} from "lucide-react";
import type { DashboardBalances, LedgerTransaction, ActiveMembership } from "./page";

type TabId = "overview" | "deposit" | "memberships" | "transactions";
type TxFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

interface PortalClientProps {
    balances: DashboardBalances;
    transactions: LedgerTransaction[];
    memberships: ActiveMembership[];
    hasPendingDeposit: boolean;
    onRequestDeposit: (amount: number) => Promise<{ success: boolean; error?: string }>;
    onCancelTransaction: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export default function PortalClient({ 
    balances, 
    transactions, 
    memberships, 
    hasPendingDeposit,
    onRequestDeposit, 
    onCancelTransaction 
}: PortalClientProps) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

    // Watch the URL and update the tab if a valid parameter is found
    useEffect(() => {
        const validTabs: TabId[] = ["overview", "deposit", "memberships", "transactions"];
        if (tabParam && validTabs.includes(tabParam as TabId)) {
            setActiveTab(tabParam as TabId);
        }
    }, [tabParam]);
       
    // Deposit Form State
    const [dollarAmount, setDollarAmount] = useState<string>("");
    const [creditAmount, setCreditAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Transaction States
    const [txFilter, setTxFilter] = useState<TxFilter>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all"); // "deposit", "purchase", etc.
    const [searchQuery, setSearchQuery] = useState<string>(""); // Text search
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    // --- DEPOSIT HANDLERS ---
    const handleDollarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDollarAmount(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
            setCreditAmount((num * 1000).toString());
        } else {
            setCreditAmount("");
        }
    };

    const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCreditAmount(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
            setDollarAmount((num / 1000).toString());
        } else {
            setDollarAmount("");
        }
    };

    const handleDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        const amount = Number(creditAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: "error", text: "Please enter a valid positive number." });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onRequestDeposit(amount);
            if (result.success) {
                setMessage({ type: "success", text: `Deposit request for ◈ ${amount.toLocaleString()} submitted and is pending approval.` });
                setDollarAmount("");
                setCreditAmount("");
            } else {
                setMessage({ type: "error", text: result.error || "Failed to submit request." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- TRANSACTION HANDLERS ---
    const handleCancelRequest = async (transactionId: number) => {
        setCancellingId(transactionId);
        try {
            const result = await onCancelTransaction(transactionId);
            if (!result.success) {
                alert(result.error);
            }
        } finally {
            setCancellingId(null);
        }
    };

    // Filter logic combining Status, Type, and Text Search
    const filteredTransactions = transactions.filter(tx => {
        const matchesStatus = txFilter === "all" || tx.status === txFilter;
        const matchesType = typeFilter === "all" || tx.transaction_type === typeFilter;
        const matchesSearch = 
            searchQuery === "" || 
            tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.amount.toString().includes(searchQuery);
            
        return matchesStatus && matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Dashboard Inner Navigation */}
            <div className="flex overflow-x-auto pb-2 gap-2 border-b border-border hide-scrollbar">
                {[
                    { id: "overview", label: "Overview", icon: Wallet },
                    { id: "deposit", label: "Deposit", icon: PlusCircle },
                    { id: "memberships", label: "Memberships", icon: Crown },
                    { id: "transactions", label: "Transactions", icon: History },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as TabId);
                                setMessage(null);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors whitespace-nowrap border-b-2 ${
                                isActive 
                                ? "border-primary text-primary bg-primary/5" 
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT: OVERVIEW (Unchanged) */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-8 rounded-3xl bg-zinc-950 dark:bg-zinc-900 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                Direct Deposit Balance
                            </p>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2">
                                <span className="text-emerald-400 mr-2 text-2xl md:text-3xl">◈</span>
                                {balances.direct.toLocaleString("en-US")}
                            </h2>
                            <p className="text-xs text-zinc-500 mt-4">Available for memberships and purchases.</p>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-zinc-900 dark:bg-zinc-950 text-white shadow-xl relative overflow-hidden border border-zinc-800">
                        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Earned Bonus Credits
                            </p>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2 text-zinc-300">
                                <span className="text-amber-500 mr-2 text-2xl md:text-3xl">✦</span>
                                {balances.bonus.toLocaleString("en-US")}
                            </h2>
                            <p className="text-xs text-zinc-500 mt-4">Earned from facility workouts and activity.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: DEPOSIT */}
            {activeTab === "deposit" && (
                <div className="max-w-md mx-auto mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <div className="mb-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">Request a Deposit</h3>
                            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground border border-border">
                                Conversion Rate: <span className="text-foreground">$1.00 = <span className="text-emerald-600 dark:text-emerald-400">◈</span> 1,000</span>
                            </div>
                        </div>

                        <form onSubmit={handleDepositSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* DOLLAR INPUT */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Dollars
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={dollarAmount}
                                            onChange={handleDollarChange}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-input bg-background text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* CREDIT INPUT */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Credits
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-600 dark:text-emerald-400">◈</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={creditAmount}
                                            onChange={handleCreditChange}
                                            required
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3.5 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !creditAmount || Number(creditAmount) <= 0}
                                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Submit for Approval"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: MEMBERSHIPS (Unchanged) */}
            {activeTab === "memberships" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {memberships.length === 0 ? (
                        <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-card">
                            <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-bold text-foreground">No Active Memberships</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">You do not currently have any active fitness subscriptions.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {memberships.map((sub) => (
                                <div key={sub.id} className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/3 shadow-sm relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                                <Crown className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{sub.name}</h3>
                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                                                    Active Status
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{sub.description}</p>
                                    <div className="pt-4 border-t border-purple-500/20">
                                        <p className="text-xs text-muted-foreground">
                                            Renews on: <strong className="text-foreground">{new Date(sub.current_period_end).toLocaleDateString()}</strong>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: TRANSACTIONS (Updated with Search & Type Filter) */}
            {activeTab === "transactions" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* Filters Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-5 items-center justify-between">
                        
                        {/* Text Search */}
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Search description or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
                            
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-background border border-input text-foreground text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 outline-none cursor-pointer flex-1 md:flex-none shadow-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="deposit">Deposits</option>
                                <option value="purchase">Purchases</option>
                                <option value="refund">Refunds</option>
                            </select>

                            <select 
                                value={txFilter}
                                onChange={(e) => setTxFilter(e.target.value as TxFilter)}
                                className="bg-background border border-input text-foreground text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 outline-none cursor-pointer flex-1 md:flex-none shadow-sm"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                        {filteredTransactions.length === 0 ? (
                            <div className="p-12 text-center text-sm text-muted-foreground">
                                No transactions match your current filters.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredTransactions.map((tx) => (
                                    <div key={tx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/30 transition-colors gap-4">
                                        
                                        {/* Status Icon & Info */}
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                tx.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                                tx.status === 'rejected' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                                                tx.status === 'cancelled' ? 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' :
                                                'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {tx.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> :
                                                tx.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                                                tx.status === 'cancelled' ? <Ban className="w-5 h-5" /> :
                                                <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{tx.description}</p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    {/* Transaction ID Added Here */}
                                                    <span className="text-xs font-mono text-muted-foreground/80">
                                                        #{tx.id}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground/50">•</span>
                                                    
                                                    <span className={`text-xs font-bold capitalize ${
                                                        tx.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' :
                                                        tx.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                                                        tx.status === 'cancelled' ? 'text-zinc-500 dark:text-zinc-400' :
                                                        'text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground/50">•</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{tx.transaction_type}</span>
                                                    <span className="text-xs text-muted-foreground/50">•</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Amount & Actions */}
                                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pl-14 sm:pl-0">
                                            {/* Cancel Button (Only show if pending deposit) */}
                                            {tx.status === 'pending' && tx.amount > 0 && (
                                                <button
                                                    onClick={() => handleCancelRequest(tx.id)}
                                                    disabled={cancellingId === tx.id}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {cancellingId === tx.id ? "Cancelling..." : "Cancel Request"}
                                                </button>
                                            )}

                                            {/* Value */}
                                            <div className="text-right">
                                                <div className={`font-extrabold text-base ${
                                                    tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                                                }`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.currency === 'BONUS' ? '✦' : '◈'}
                                                </div>
                                                {tx.currency === 'BONUS' && (
                                                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block mt-0.5">Bonus</span>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}