"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { signOut } from "next-auth/react";

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

interface HubMenuProps {
    categories: ServiceCategory[];
}

interface ServiceCategoryForTitle {
    title: string;
    titleColor: string;
    href: string;
}

// 1. Hide Left Side Menu on Home Page
export const HideOnHome = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    if (pathname === "/") return null;
    return <>{children}</>;
};

// 2. Dynamic Center Title with Fallback for Profile/Other Pages
export const DynamicPageTitle = ({ categories }: { categories: ServiceCategoryForTitle[] }) => {
    const pathname = usePathname();
    
    if (pathname === "/") return null;

    // 1. Check if it matches a main hub category (Fitness, Bank, Gaming)
    const activeCategory = categories.find((cat) => pathname.startsWith(cat.href));

    if (activeCategory) {
        // If it's a hub service, use its custom styled title and link
        return (
            <Link 
                href={activeCategory.href} 
                className={`tracking-widest hover:opacity-80 transition-opacity ${activeCategory.titleColor}`}
            >
                {activeCategory.title}
            </Link>
        );
    }

    // 2. FALLBACK for non-hub pages (like /profile, /settings, etc.)
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const mainSection = segments[0]; // e.g., "profile"
    const mainHref = `/${mainSection}`;
    const mainTitle = mainSection.replaceAll("-", " ").toUpperCase();

    return (
        <Link 
            href={mainHref} 
            className="tracking-widest text-foreground hover:opacity-80 transition-opacity"
        >
            {mainTitle}
        </Link>
    );
};

// 3. Hamburger Menu for Hub Services
export const HubMenu = ({ categories }: HubMenuProps) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const pathname = usePathname();

    const handleClose = () => {
        if (detailsRef.current) {
            detailsRef.current.removeAttribute("open");
        }
    };

    // Close the menu when clicking anywhere outside of it (or pressing Escape)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                detailsRef.current &&
                detailsRef.current.hasAttribute("open") &&
                !detailsRef.current.contains(event.target as Node)
            ) {
                handleClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // 1. Check if we are inside a specific service (like /fitness or /bank)
    const activeCategory = categories.find((cat) => pathname.startsWith(cat.href));

    // 2. Choose which menu columns to display
    const menuToRender = activeCategory?.subMenu && activeCategory.subMenu.length > 0
        ? activeCategory.subMenu
        : categories;

    return (
        <details ref={detailsRef} className="group">
            <summary className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none cursor-pointer flex items-center justify-center list-none [&::-webkit-details-marker]:hidden">
                <Menu className="w-5 h-5 pointer-events-none" />
            </summary>
            
            <div className="fixed top-14 left-0 w-full max-h-[calc(100vh-3.5rem)] overflow-y-auto bg-background border-b border-border shadow-2xl z-100 cursor-default">
                <div className="w-full max-w-7xl mx-auto p-5 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {menuToRender.map((section, index) => (
                        <div key={index} className="flex flex-col">
                            <Link 
                                href={section.href} 
                                onClick={handleClose}
                                className={`text-m font-bold ${section.titleColor || "text-foreground"} mb-4 uppercase tracking-widest border-b border-border pb-2`}
                            >
                                {section.title}
                            </Link>
                            
                            <div className="flex flex-col space-y-3">
                                {section.services.length > 0 ? (
                                    section.services.map((service, sIndex) => (
                                        <Link 
                                            key={sIndex} 
                                            href={service.href} 
                                            onClick={handleClose}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {service.name}
                                        </Link>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground/60 italic">
                                        {section.fallbackText || "Coming soon..."}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </details>
    );
};

// 4. Dynamic Coloured Badge for "Hub"
export const HubBadge = () => {
    const pathname = usePathname();

    // Default fallback style if not on a specific service route
    let badgeBg = "bg-zinc-800 text-white dark:bg-white dark:text-zinc-800";

    if (pathname.startsWith("/fitness")) {
        badgeBg = "bg-purple-600 text-white dark:bg-purple-500 dark:text-zinc-800";
    } else if (pathname.startsWith("/bank")) {
        badgeBg = "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-800";
    } else if (pathname.startsWith("/gaming")) {
        badgeBg = "bg-rose-600 text-white dark:bg-rose-500 dark:text-zinc-800";
    }

    return (
        <span className={`ml-0.5 px-1 py-0.5 rounded-md transition-colors ${badgeBg}`}>
            Hub
        </span>
    );
};

// 5. User Dropdown Menu for Logged-in Users
export const UserMenu = ({ username }: { username: string }) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const pathname = usePathname(); // 2. Get the current page URL path

    const handleClose = () => {
        if (detailsRef.current) {
            detailsRef.current.removeAttribute("open");
        }
    };

    const handleSignOut = async () => {
        handleClose();
        await signOut({ 
            callbackUrl: pathname === "/profile" ? "/" : pathname 
        });
    };

    return (
        <details ref={detailsRef} className="relative group">
            <summary className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-md text-muted-foreground hover:bg-muted hover:text-foreground outline-none cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                {username} ▾
            </summary>
            
            <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-xl py-1 z-50">
                <Link
                    href="/profile"
                    onClick={handleClose}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    Profile
                </Link>
                
                <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors cursor-pointer"
                >
                    Sign out
                </button>
            </div>
        </details>
    );
};

// 6. Dynamic Login Button that remembers your current page
export const LoginButton = () => {
    const pathname = usePathname();
    const loginHref = pathname === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(pathname)}`;

    return (
        <Link
            href={loginHref}
            className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
            Log in
        </Link>
    );
};