import Link from "next/link";
import { HideOnHome, DynamicPageTitle } from "./NavPathLogic";
import { ThemeToggle } from "./ThemeToggle";
import { HubMenu } from "./HubMenu";

interface ServiceLink {
    name: string;
    href: string;
}

interface ServiceCategory {
    title: string;
    titleColor: string;
    href: string;
    services: ServiceLink[];
    fallbackText?: string;
}

const HUB_CATEGORIES: ServiceCategory[] = [
    {
        title: "Fitness",
        titleColor: "text-purple-500 dark:text-purple-400",
        href: "/fitness",
        services: [
            { name: "Manage Membership", href: "/manage-membership" },
            { name: "Workout Statistics", href: "/workout-statistics" },
        ],
    },
    {
        title: "Ego Bank",
        titleColor: "text-emerald-500 dark:text-emerald-400",
        href: "/bank",
        services: [],
        fallbackText: "Coming soon...",
    },
    {
        title: "Ego Gaming",
        titleColor: "text-rose-500 dark:text-rose-400",
        href: "/gaming",
        services: [],
        fallbackText: "Coming soon...",
    },
];


// Navbar component
const Navbar = () => {
    const currentUser = null; 

    return (
        <div className="sticky top-0 w-full h-14 px-6 flex justify-between items-center z-50 bg-background border-b border-border transition-colors">
            
            {/* Left Side: Client wrapper hides menu on "/" */}
            <div className="flex-1 flex justify-start items-center gap-2">
                <HideOnHome>
                    <HubMenu categories={HUB_CATEGORIES} />
                    <Link href="/" className="px-3 py-2 font-extrabold tracking-tight text-foreground hover:text-foreground transition-colors">
                        Ego <span className="text-muted-foreground">Hub</span>
                    </Link>
                </HideOnHome>
            </div>

            {/* Center: Client component generates dynamic title */}
            <div className="absolute left-1/2 -translate-x-1/2 font-bold tracking-widest text-foreground">
                <DynamicPageTitle />
            </div>

            {/* Right Side: ThemeToggle and Login */}
            <div className="flex-1 flex justify-end items-center gap-2 relative z-20">
                <ThemeToggle />

                {currentUser ? (
                    <Link href="/profile" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                        {currentUser}
                    </Link>
                ) : (
                    <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                        Log in
                    </Link>
                )}
            </div>
            
        </div>
    );
}

export default Navbar;