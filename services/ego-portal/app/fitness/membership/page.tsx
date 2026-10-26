// app/fitness/membership/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import MembershipClient from "./MembershipClient";
import { revalidatePath } from "next/cache";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
    title: "Memberships | Ego Fitness",
    description: "Explore and subscribe to Ego Fitness membership tiers.",
};

interface ProductFeature {
    feature_text: string;
}

export interface MembershipProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    billing_cycle: string;
    features: string[];
}

export interface MembershipSubscription {
    user_id: number;
    product_id: number;
    status: string;
    current_period_end: Date;
    created_at: Date;
}

export interface MembershipFaq {
    id: number;
    question: string;
    answer: string;
}

export interface SubscribeActionResult {
    success: boolean;
    error?: string;
}

async function getMembershipProducts(): Promise<MembershipProduct[]> {
    try {
        const productsResult = await pool.query(
            "SELECT id, name, description, price, billing_cycle FROM products WHERE is_active = true AND merchant_id = 2 ORDER BY price ASC"
        );

        const products: MembershipProduct[] = [];

        for (const row of productsResult.rows) {
            const featuresResult = await pool.query(
                "SELECT feature_text FROM product_features WHERE product_id = $1 ORDER BY sort_order ASC",
                [row.id]
            );

            products.push({
                id: row.id,
                name: row.name,
                description: row.description || "",
                price: Number(row.price),
                billing_cycle: row.billing_cycle,
                features: featuresResult.rows.map((f: ProductFeature) => f.feature_text),
            });
        }

        return products;
    } catch (error) {
        console.error("Failed to fetch membership products from database:", error);
        return [];
    }
}

async function getMembershipFaqs(): Promise<MembershipFaq[]> {
    try {
        const result = await pool.query<MembershipFaq>(
            `SELECT id, question, answer 
             FROM public.product_faqs 
             WHERE is_active = true 
             ORDER BY display_order ASC, id ASC`
        );
        return result.rows;
    } catch (error) {
        console.error("Failed to fetch membership FAQs from database:", error);
        return [];
    }
}

async function getMembership(userId: string): Promise<MembershipSubscription | null> {
    try {
        const result = await pool.query(
            "SELECT user_id, product_id, status, current_period_end, created_at FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1",
            [userId]
        );

        if (!result.rows || result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            user_id: row.user_id,
            product_id: row.product_id,
            status: row.status,
            current_period_end: row.current_period_end,
            created_at: row.created_at,
        };
    } catch (error) {
        console.error("Failed to fetch subscription from database:", error);
        return null;
    }
}

// terms and condition
function ServerTermsContent() {
    return (
        <>
            <p>
                <strong>1. Immediate Revocation on Cancellation:</strong> By subscribing to any membership tier, you acknowledge and agree that cancelling an active subscription revokes all membership perks, digital access, and physical facility access immediately upon confirmation. No prorated refunds or credits are issued for unused time remaining in a billing cycle.
            </p>
            <p>
                <strong>2. Automated Ledger Deductions:</strong> Membership fees are denominated in platform Credits (◈) and deducted automatically upon initial subscription and on each subsequent renewal date from your approved Bank of Ego ledger balance.
            </p>
            <p>
                <strong>3. Plan Switching & Upgrades:</strong> Switching from an active membership tier to another takes effect immediately. Your previous tier benefits are replaced by the newly selected tier, and the full price of the new tier is charged at the time of switching.
            </p>
            <p>
                <strong>4. Facility Access & Conduct:</strong> Physical check-ins require a valid, registered NFC credential. Sharing credentials or bypassing presence monitoring systems may result in immediate termination of your membership without refund.
            </p>
            <p>
                <strong>5. Modifications:</strong> Ego Fitness reserves the right to modify membership pricing, perks, or terms at any time. Continued use of your membership constitutes acceptance of the updated terms.
            </p>
        </>
    );
}

// FAQ Section
function ServerFaqSection({ faqs }: { faqs: MembershipFaq[] }) {
    if (faqs.length === 0) return null;

    return (
        <div className="pt-12 border-t border-border mt-12">
            <div className="mb-8">
                <h3 className="text-2xl text-center font-bold tracking-tight text-foreground">
                    Frequently Asked Questions
                </h3>
                <p className="text-sm text-center text-muted-foreground mt-1">
                    Everything you need to know about memberships and billing.
                </p>
            </div>

            <div className="divide-y divide-border/60 border-t border-b border-border/60">
                {faqs.map((faq) => (
                    <details
                        key={faq.id}
                        className="group py-6 transition-colors"
                    >
                        <summary className="w-full flex items-center justify-between text-left font-bold text-lg text-foreground hover:text-primary transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <span className="flex items-start gap-3">
                                <span className="text-primary font-extrabold shrink-0">Q:</span>
                                <span>{faq.question}</span>
                            </span>
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180 ml-4" />
                        </summary>
                        <div className="mt-3.5 pl-8 text-base text-muted-foreground leading-relaxed flex items-start gap-3">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">A:</span>
                            <span>{faq.answer}</span>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}

const FitnessMembershipContent = async () => {
    await connection();
    const [session, memberships, faqs] = await Promise.all([
        auth(),
        getMembershipProducts(),
        getMembershipFaqs(),
    ]);

    if (!session?.user?.id) {
        return <GuestOverview memberships={memberships} faqs={faqs} />;
    }

    return (
        <MembersDashboard
            userId={session.user.id}
            username={session.user.name || "Athlete"}
            memberships={memberships}
            faqs={faqs}
        />
    );
};

function GuestOverview({
    memberships,
    faqs,
}: {
    memberships: MembershipProduct[];
    faqs: MembershipFaq[];
}) {
    return (
        <div className="max-w-5xl mx-auto py-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                    Explore Memberships
                </h1>
                <p className="text-muted-foreground text-sm">
                    Choose a plan to unlock full access to Ego Fitness analytics and community features.
                </p>
            </div>

            <MembershipClient
                memberships={memberships}
                isGuest={true}
                termsContent={<ServerTermsContent />}
            >
                <ServerFaqSection faqs={faqs} />
            </MembershipClient>
        </div>
    );
}

async function MembersDashboard({
    userId,
    username,
    memberships,
    faqs,
}: {
    userId: string;
    username: string;
    memberships: MembershipProduct[];
    faqs: MembershipFaq[];
}) {
    const activeSubscription = await getMembership(userId);

    async function handleSubscribeAction(productId: number): Promise<SubscribeActionResult> {
        "use server";
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const balanceResult = await client.query(
                `SELECT COALESCE(SUM(amount), 0) AS balance
                 FROM public.ledger
                 WHERE user_id = $1 
                   AND currency = 'EGO' 
                   AND status = 'approved'`,
                [userId]
            );

            const productResult = await client.query(
                `SELECT name, price, billing_cycle 
                 FROM public.products 
                 WHERE id = $1 AND is_active = true`,
                [productId]
            );

            if (productResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return { success: false, error: "Membership tier not found." };
            }

            const currentBalance = Number(balanceResult.rows[0]?.balance ?? 0);
            const product = productResult.rows[0];
            const membershipPrice = Number(product.price);

            // Check if balance is sufficient
            if (currentBalance < membershipPrice) {
                const shortfall = (membershipPrice - currentBalance).toLocaleString("en-US");
                await client.query("ROLLBACK");
                return {
                    success: false,
                    error: `Insufficient balance. You have ◈ ${currentBalance.toLocaleString("en-US")} available, and need ◈ ${shortfall} more Credits to subscribe.`,
                };
            }

            // 1. Cancel any existing active subscription if switching tiers
            await client.query(
                `UPDATE public.subscriptions 
                 SET status = 'cancelled' 
                 WHERE user_id = $1 AND status = 'active'`,
                [userId]
            );

            // 2. Deduct credits from the ledger
            const ledgerResult = await client.query(
                `INSERT INTO public.ledger (user_id, amount, currency, status, description, merchant_id, transaction_type)
                 VALUES ($1, $2, 'EGO', 'approved', $3, 2, 'purchase')
                 RETURNING id`,
                [userId, -membershipPrice, `Subscribed to ${product.name}`]
            );

            const ledgerId = ledgerResult.rows[0].id;
            // 3. Insert the new active subscription
            const interval =
                product.billing_cycle?.toLowerCase() === "yearly" ? "1 year" : "1 month";

            await client.query(
                `INSERT INTO public.subscriptions (user_id, product_id, status, current_period_end, ledger_id)
                 VALUES ($1, $2, 'active', NOW() + $3::interval, $4)`,
                [userId, productId, interval, ledgerId]
            );

            await client.query("COMMIT");
            revalidatePath("/fitness/membership");
            return { success: true };
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Failed to subscribe:", error);
            return {
                success: false,
                error: "Something went wrong while processing your subscription. Please try again.",
            };
        } finally {
            client.release();
        }
    }

    async function handleUnsubscribeAction() {
        "use server";
        try {
            await pool.query(
                "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
                [userId]
            );
            console.log(`User ${userId} unsubscribed.`);
            revalidatePath("/fitness/membership");
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-4">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                    Welcome back, {username}!
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your subscription or upgrade your active membership tier below.
                </p>
            </div>

            <MembershipClient
                memberships={memberships}
                isGuest={false}
                currentSubscription={activeSubscription}
                onSubscribeAction={handleSubscribeAction}
                onUnsubscribeAction={handleUnsubscribeAction}
                termsContent={<ServerTermsContent />}
            >
                <ServerFaqSection faqs={faqs} />
            </MembershipClient>
        </div>
    );
}

const MembershipPage = () => {
    return (
        <main className="p-6 md:p-10">
            <Suspense
                fallback={
                    <div className="max-w-5xl mx-auto text-muted-foreground">
                        Loading memberships...
                    </div>
                }
            >
                <FitnessMembershipContent />
            </Suspense>
        </main>
    );
};

export default MembershipPage;