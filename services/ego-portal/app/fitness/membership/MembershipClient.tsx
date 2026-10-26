// app/fitness/membership/MembershipClient.tsx
"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, Crown, Dumbbell, Calendar, X } from "lucide-react";
import type { MembershipProduct, MembershipSubscription, SubscribeActionResult } from "./page";

interface MembershipClientProps {
    memberships: MembershipProduct[];
    isGuest: boolean;
    currentSubscription?: MembershipSubscription | null;
    onSubscribeAction?: (productId: number) => Promise<SubscribeActionResult | void>;
    onUnsubscribeAction?: () => Promise<void>;
    children?: ReactNode;
    termsContent?: ReactNode;
}

export default function MembershipClient({
    memberships,
    isGuest,
    currentSubscription = null,
    onSubscribeAction,
    onUnsubscribeAction,
    children,
    termsContent,
}: MembershipClientProps) {
    const pathname = usePathname();
    const currentProductId = currentSubscription?.product_id ?? null;

    const [selectedId, setSelectedId] = useState<number | null>(currentProductId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Modal visibility states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedId(currentProductId);
    }, [pathname, currentProductId]);

    // Step 1 (Subscribe): Select card on first click, open confirmation modal on second click
    const handleSubscribeButtonClick = (productId: number) => {
        if (selectedId !== productId) {
            setSelectedId(productId);
            return;
        }
        if (!onSubscribeAction || productId === currentProductId) return;
        setSubscribeError(null);
        setShowSubscribeModal(true);
    };

    // Step 2 (Subscribe): Check the returned result before closing the modal
    const handleConfirmSubscribe = async (productId: number) => {
        if (!onSubscribeAction || productId === currentProductId) return;
        setIsSubmitting(true);
        setSubscribeError(null);

        try {
            const result = await onSubscribeAction(productId);
            if (result && !result.success) {
                // Keep modal open and show the error banner!
                setSubscribeError(result.error || "Insufficient balance to complete this purchase.");
                return;
            }
            // Only close the modal if it succeeded
            setShowSubscribeModal(false);
        } catch {
            setSubscribeError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 1 (Unsubscribe): Open unsubscribe modal
    const handleUnsubscribeClick = () => {
        if (!onUnsubscribeAction) return;
        setShowConfirmModal(true);
    };

    // Step 2 (Unsubscribe): Confirm inside modal
    const handleConfirmCancel = async () => {
        if (!onUnsubscribeAction) return;
        setShowConfirmModal(false);
        setIsCancelling(true);

        try {
            await onUnsubscribeAction();
        } finally {
            setIsCancelling(false);
        }
    };

    const formattedRenewalDate = currentSubscription?.current_period_end
        ? new Date(currentSubscription.current_period_end).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : null;

    return (
        <div className="space-y-6">
            {/* Active Subscription Banner */}
            {!isGuest && currentSubscription && formattedRenewalDate && (
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-300">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                            Your active subscription renews on <strong>{formattedRenewalDate}</strong>.
                        </span>
                    </div>
                </div>
            )}

            {/* Membership Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memberships.map((tier, index) => {
                    const isPremium =
                        tier.name.toLowerCase().includes("premium") || index > 0;
                    const TierIcon = isPremium ? Crown : Dumbbell;

                    const isCurrent = !isGuest && currentProductId === tier.id;
                    const isSelected = !isGuest && selectedId === tier.id;

                    let cardHighlightClass =
                        "border-border bg-card hover:border-foreground/30 hover:bg-muted/20";
                    if (!isGuest) {
                        if (isCurrent) {
                            cardHighlightClass =
                                "border-purple-500/70 bg-purple-500/[0.04] ring-1 ring-purple-500/40";
                        } else if (isSelected) {
                            cardHighlightClass =
                                "border-zinc-400 dark:border-zinc-500 bg-muted/40 ring-1 ring-zinc-400/40";
                        }
                    }

                    const cardInnerContent = (
                        <>
                            <div>
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                                        isPremium
                                            ? "bg-amber-500/15 text-amber-500"
                                            : "bg-purple-500/15 text-purple-500"
                                    }`}
                                >
                                    <TierIcon className="w-5 h-5" />
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                        {tier.name}
                                    </h2>

                                    {isCurrent && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                            Current Subscription
                                        </span>
                                    )}

                                    {!isCurrent && isSelected && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600">
                                            Selected
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {tier.description}
                                </p>

                                <div className="mt-5 flex items-baseline gap-1.5">
                                    <span className="inline-flex items-center gap-1.5 text-3xl font-extrabold text-foreground">
                                        <span className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base leading-none">
                                            ◈
                                        </span>
                                        {tier.price.toLocaleString("en-US")}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        / {tier.billing_cycle}
                                    </span>
                                </div>

                                <ul className="mt-6 space-y-2.5 border-t border-border pt-4">
                                    {tier.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="text-sm text-muted-foreground">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 pt-4 border-t border-border">
                                {isGuest ? (
                                    <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm group-hover:opacity-90 transition-opacity">
                                        <span>Get Started Today</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                ) : isCurrent ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold text-sm">
                                            <span>Active Plan</span>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isCancelling}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnsubscribeClick();
                                            }}
                                            className="px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold text-sm transition-colors cursor-pointer"
                                        >
                                            Unsubscribe
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubscribeButtonClick(tier.id);
                                        }}
                                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                                : "bg-muted text-foreground hover:bg-muted/80"
                                        }`}
                                    >
                                        <span>
                                            {isSelected
                                                ? `Subscribe for ${tier.price.toLocaleString("en-US")} Credits`
                                                : "Get Started Today"}
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* --- CUSTOM SUBSCRIBE CONFIRMATION MODAL OVERLAY --- */}
                            {showSubscribeModal && isSelected && !isCurrent && (
                                <div 
                                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-full max-w-[400px] rounded-3xl bg-white p-8 shadow-2xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 text-center relative overflow-hidden">
                                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                                        <div
                                            className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 border-[6px] border-white dark:border-zinc-950 shadow-sm ${
                                                isPremium
                                                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                                                    : "bg-purple-50 dark:bg-purple-500/10 text-purple-500"
                                            }`}
                                        >
                                            <TierIcon className="h-7 w-7" />
                                        </div>

                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                                            Confirm {tier.name}
                                        </h3>
                                        
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                                            Review your membership details below before confirming your subscription.
                                        </p>

                                        <div className="mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500 dark:text-zinc-400">Selected Plan</span>
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{tier.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500 dark:text-zinc-400">Billing Cycle</span>
                                                <span className="font-medium capitalize text-zinc-800 dark:text-zinc-200">{tier.billing_cycle}</span>
                                            </div>
                                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2.5 flex items-center justify-between">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Due Today</span>
                                                <span className="inline-flex items-center gap-1 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                                                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">◈</span>
                                                    {tier.price.toLocaleString("en-US")}
                                                </span>
                                            </div>

                                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                                                    Included Perks
                                                </p>
                                                <ul className="space-y-1.5">
                                                    {tier.features.map((feat, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                                                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                            <span>{feat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {currentSubscription && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-2.5 mb-5">
                                                Switching plans will replace your current active membership immediately.
                                            </p>
                                        )}
                                    
{/* Insufficient Balance / Error Banner */}
                                        {subscribeError && (
                                            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-800 dark:text-red-300 text-xs font-medium text-left flex items-start gap-2.5 shadow-inner animate-in fade-in duration-150">
                                                <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{subscribeError}</span>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-3">
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => handleConfirmSubscribe(tier.id)}
                                                className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                {isSubmitting
                                                    ? "Processing..."
                                                    : `Confirm & Pay ${tier.price.toLocaleString("en-US")} Credits`}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    setSubscribeError(null);
                                                    setShowSubscribeModal(false);
                                                }}
                                                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                Go Back
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- CUSTOM UNSUBSCRIBE CONFIRMATION MODAL OVERLAY --- */}
                            {showConfirmModal && isCurrent && (
                                <div 
                                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-full max-w-[400px] rounded-3xl bg-white p-8 shadow-2xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 text-center relative overflow-hidden">
                                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                                        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 mb-6 border-[6px] border-white dark:border-zinc-950 shadow-sm text-red-600 dark:text-red-500">
                                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>

                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                                            Cancel {tier.name}?
                                        </h3>
                                        
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                                            Review the membership perks you will lose below before confirming your cancellation.
                                        </p>

                                        <div className="mb-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500 dark:text-zinc-400">Active Plan</span>
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{tier.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500 dark:text-zinc-400">Revocation</span>
                                                <span className="font-semibold text-red-600 dark:text-red-400">Effective Immediately</span>
                                            </div>

                                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                                                    Perks You Will Lose
                                                </p>
                                                <ul className="space-y-1.5">
                                                    {tier.features.map((feat, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 line-through decoration-zinc-400/50">
                                                            <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                            <span>{feat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-800 dark:text-red-300 text-xs font-medium text-left flex items-start gap-2.5 shadow-inner">
                                            <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                                Unsubscribing revokes all your {tier.name} access <strong>immediately today</strong>, not on your period end date.
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmModal(false)}
                                                className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                Keep My Subscription
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleConfirmCancel}
                                                disabled={isCancelling}
                                                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-400 dark:hover:bg-zinc-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                {isCancelling ? "Cancelling..." : "Yes, cancel immediately"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    );

                    if (isGuest) {
                        return (
                            <Link
                                key={tier.id}
                                href={`/login?callbackUrl=${encodeURIComponent("/fitness/membership")}`}
                                className={`group rounded-xl border p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer ${cardHighlightClass}`}
                            >
                                {cardInnerContent}
                            </Link>
                        );
                    }

                    return (
                        <div
                            key={tier.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(tier.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedId(tier.id);
                                }
                            }}
                            className={`rounded-xl border p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer text-left ${cardHighlightClass}`}
                        >
                            {cardInnerContent}
                        </div>
                    );
                })}
            </div>

            {/* --- SERVER-RENDERED FAQ SECTION SLOTS HERE --- */}
            {children}

            {/* --- TINY, LOW-CONTRAST TERMS & CONDITIONS BUTTON --- */}
            {termsContent && (
                <div className="pt-6 pb-2 text-center">
                    <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-[10px] text-zinc-400/40 dark:text-zinc-600/40 hover:text-zinc-500 dark:hover:text-zinc-500 transition-colors cursor-pointer select-none"
                    >
                        Terms & Conditions
                    </button>
                </div>
            )}

            {/* --- TERMS & CONDITIONS MODAL SHELL --- */}
            {showTermsModal && termsContent && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
                    onClick={() => setShowTermsModal(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 text-left relative overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                Membership Terms & Conditions
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Server-rendered legal paragraphs slot right here */}
                        <div className="my-4 overflow-y-auto pr-2 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {termsContent}
                        </div>

                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all cursor-pointer"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}