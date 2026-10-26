import Link from "next/link";
import { connection } from "next/server";
import { DynamicPageTitle, HubMenu, HubBadge, UserMenu, LoginButton} from "./NavBarClientLogic";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@/auth";
import { pool } from "@/lib/db"

interface ServiceLink {
    name: string;
    href: string;
}

interface MenuSection {
    title: string;
    titleColor: string;
    href: string;
    services: ServiceLink[];
    fallbackText?: string;
}

interface ServiceCategory extends MenuSection {
    subMenu?: MenuSection[];
}

const HUB_CATEGORIES: ServiceCategory[] = [
    {
        title: "Ego Fitness",
        titleColor: "text-purple-600 dark:text-purple-500",
        href: "/fitness",
        // 1. What shows under "Ego Fitness" when on the main Hub ("/")
        services: [
            { name: "Overview", href: "/fitness" },
            { name: "Membership", href: "/fitness/membership" },
            { name: "Stats", href: "/fitness/stats" },
        ],
        // 2. What columns show in the hamburger menu when INSIDE "/fitness..."
        subMenu: [
            {
                title: "Overview",
                titleColor: "text-purple-600 dark:text-purple-500",
                href: "/fitness",
                services: [
                    { name: "Dashboard", href: "/fitness" },
                    { name: "Equipment & Facility", href: "/fitness#facility" },
                    { name: "Class Schedule", href: "/fitness/schedule" },
                ],
            },
            {
                title: "Membership",
                titleColor: "text-purple-600 dark:text-purple-500",
                href: "/fitness/membership",
                services: [
                    { name: "Perks & Tiers", href: "/fitness/membership#perks" },
                    { name: "Manage Membership", href: "/fitness/manage-membership" },
                ],
            },
            {
                title: "Stats & Tracking",
                titleColor: "text-purple-600 dark:text-purple-500",
                href: "/fitness/stats",
                services: [
                    { name: "Workout Logs", href: "/fitness/stats" },
                    { name: "Personal Records", href: "/fitness/stats/pr" },
                ],
            },
        ],
    },
    {
        title: "Bank of Ego",
        titleColor: "text-emerald-600 dark:text-emerald-500",
        href: "/bank",
        // What shows on the main Hub ("/")
        services: [
            { name: "Overview", href: "/bank" },
            { name: "Top Up Balance", href: "/bank/top-up" },
        ],
        // What columns show when INSIDE "/bank..."
        subMenu: [
            {
                title: "Overview",
                titleColor: "text-emerald-600 dark:text-emerald-500",
                href: "/bank",
                services: [
                    { name: "Account Summary", href: "/bank" },
                    { name: "Recent Activity", href: "/bank/activity" },
                ],
            },
            {
                title: "Funds & Transfers",
                titleColor: "text-emerald-600 dark:text-emerald-500",
                href: "/bank/top-up",
                services: [
                    { name: "Top Up Balance", href: "/bank/top-up" },
                    { name: "Send Credits", href: "/bank/transfer" },
                ],
            },
        ],
    },
    {
        title: "Ego Gaming",
        titleColor: "text-rose-600 dark:text-rose-500",
        href: "/gaming",
        services: [],
        fallbackText: "Coming soon...",
        subMenu: [],
    },
];

// Navbar component
const Navbar = async () => {
    await connection();
    
    const session = await auth();
    let currentUser = session?.user?.name || null;
    const userId = session?.user?.id || null;

    // 1. Default balance to 0 for logged-out users
    let balance = 0;

    // 2. If logged in, fetch their balance from PostgreSQL
    if (userId) {
        try {
            // Grab BOTH username and balance in one query using the immutable id!
            const result = await pool.query(
                `SELECT 
                    username, 
                    (
                        SELECT COALESCE(SUM(amount), 0) 
                        FROM public.ledger 
                        WHERE user_id = $1 
                        AND currency = 'EGO' 
                        AND status = 'approved'
                    ) AS balance 
                FROM user_data 
                WHERE id = $1`,
                [userId]
            );
            if (result.rows[0]) {
                currentUser = result.rows[0].username;
                balance = Number(result.rows[0].balance ?? 0);
            }
        } catch (error) {
            console.error("Failed to fetch user navbar data:", error);
        }
    }

    const topUpPath = "/bank/top-up";
    const addBalanceHref = currentUser 
        ? topUpPath 
        : `/login?callbackUrl=${encodeURIComponent(topUpPath)}`;

    return (
        <div className="sticky top-0 w-full h-14 px-3 sm:px-6 grid grid-cols-2 md:grid-cols-3 items-center gap-2 z-50 bg-background border-b border-border transition-colors">
            
            {/* Column 1: Left Side */}
            <div className="flex justify-start items-center gap-1 sm:gap-2 shrink-0">
                <HubMenu categories={HUB_CATEGORIES} />

                    <Link href="/" className="flex px-2 sm:px-3 py-2 font-extrabold tracking-tight text-foreground hover:opacity-80 transition-opacity items-center gap-0">
                        Ego<HubBadge />
                    </Link>
            </div>

            {/* Column 2: Center Title */}
            <div className="hidden md:flex text-2xl font-extrabold justify-center items-center tracking-widest text-foreground truncate px-1">
                <DynamicPageTitle categories={HUB_CATEGORIES} />
            </div>

            {/* Column 3: Right Side */}
            <div className="flex justify-end items-center gap-1.5 sm:gap-3 relative z-20 shrink-0">
                
                {/* Rectangular Balance Display Box */}
                <div className="flex items-center h-8 sm:h-9 rounded-md border border-border bg-muted/40 overflow-hidden text-xs sm:text-sm font-medium shrink-0 whitespace-nowrap">
                    <span className="px-2 sm:px-3 text-foreground tabular-nums flex items-center gap-1 sm:gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base leading-none">
                            ◈
                        </span>
                        <span>{balance.toLocaleString()}</span>
                    </span>
                    <Link
                        href={addBalanceHref}
                        title="Add Balance"
                        className="flex items-center justify-center h-full px-2 sm:px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-l border-border font-bold transition-colors"
                    >
                        +
                    </Link>
                </div>

                <ThemeToggle />

                {currentUser ? (
                    <UserMenu username={currentUser} />
                ) : (
                    <LoginButton />
                )}
            </div>
            
        </div>
    );
}

export default Navbar;