// app/profile/ProfileClient.tsx
"use client";

import { useState, useActionState } from "react";
import { User, KeyRound, Calendar, Hash, AtSign, LogOut, ShieldCheck} from "lucide-react";
import { updatePasswordAction, updateUsernameAction } from "./actions";
import { signOut } from "next-auth/react";

interface ProfileClientProps {
    user: {
        id: string;
        username: string;
        createdAt: string;
        is_admin: boolean
    };
}

type TabType = "info" | "username" | "password" | "log-out";

export default function ProfileClient({ user }: ProfileClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>("info");

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    }

    return (
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            {/* Left Side: Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
                <h1 className="text-2xl font-extrabold tracking-tight mb-6">Settings</h1>
                <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full whitespace-nowrap cursor-pointer ${
                            activeTab === "info"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <User className="w-4 h-4 shrink-0" />
                        <span>Account Info</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("username")}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full whitespace-nowrap cursor-pointer ${
                            activeTab === "username"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <AtSign className="w-4 h-4 shrink-0" />
                        <span>Change Username</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("password")}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full whitespace-nowrap cursor-pointer ${
                            activeTab === "password"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <KeyRound className="w-4 h-4 shrink-0" />
                        <span>Change Password</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full whitespace-nowrap cursor-pointer bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </nav>
            </aside>

            {/* Right Side: Dynamic Content Panel */}
            <section className="flex-1 rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
                {activeTab === "info" && (
                    <div>
                        <h2 className="text-xl font-bold mb-1">Account Information</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            View your EgoHub profile details.
                        </p>

                        <div className="divide-y divide-border border-t border-border">
                            {/* Username */}
                            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" /> Username
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                    {user.username}
                                </span>
                            </div>

                            {/* Admin status */}
                            {user.is_admin && (
                                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2.5">
                                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> 
                                        Account Privilege
                                    </span>
                                    
                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 shadow-sm">
                                        Administrator
                                    </span>
                                </div>
                            )}

                            {/* User ID */}
                            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Hash className="w-4 h-4" /> Account ID
                                </span>
                                <span className="text-sm font-mono text-foreground">
                                    #{user.id}
                                </span>
                            </div>

                            {/* Date Created */}
                            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date Created
                                </span>
                                <span className="text-sm text-foreground">
                                    {user.createdAt}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "username" && (
                    <ChangeUsernameForm currentUsername={user.username} />
                )}

                {activeTab === "password" && <ChangePasswordForm />}
            </section>
        </div>
    );
}

function ChangeUsernameForm({ currentUsername }: { currentUsername: string }) {
    const [state, formAction, isPending] = useActionState(updateUsernameAction, null);
    

    return (
        <div>
            <h2 className="text-xl font-bold mb-1">Change Username</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Updating your username will also change the username you use to log in.
            </p>

            <form action={formAction} className="space-y-4 max-w-md">
                {state?.error && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
                        {state.error}
                    </div>
                )}

                {state?.success && (
                    <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-600 dark:text-emerald-400">
                        {state.success}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground block">
                        Current Username
                    </label>
                    <input
                        type="text"
                        value={currentUsername}
                        disabled
                        className="w-full px-3 py-2 rounded-md border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground block">
                        New Username
                    </label>
                    <input
                        type="text"
                        name="newUsername"
                        placeholder="Enter new username"
                        required
                        minLength={3}
                        maxLength={20}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground block">
                        Confirm with Current Password
                    </label>
                    <input
                        type="password"
                        name="currentPassword"
                        placeholder="Enter your password"
                        required
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? "Saving..." : "Update Username"}
                </button>
            </form>
        </div>
    );
}

function ChangePasswordForm() {
    const [state, formAction, isPending] = useActionState(updatePasswordAction, null);

    return (
        <div>
            <h2 className="text-xl font-bold mb-1">Change Password</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Enter your current password to set a new one.
            </p>

            <form action={formAction} className="space-y-4 max-w-md">
                {state?.error && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
                        {state.error}
                    </div>
                )}

                {state?.success && (
                    <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-600 dark:text-emerald-400">
                        {state.success}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground block">
                        Current Password
                    </label>
                    <input
                        type="password"
                        name="currentPassword"
                        required
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground block">
                        New Password
                    </label>
                    <input
                        type="password"
                        name="newPassword"
                        required
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground block">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}