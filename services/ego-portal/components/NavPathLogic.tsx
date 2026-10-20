"use client";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

// 1. Hide on Home Wrapper
export const HideOnHome = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    if (pathname === "/") return null;
    return <>{children}</>;
};

// 2. Dynamic Title
export const DynamicPageTitle = () => {
    const pathname = usePathname();
    if (pathname === "/") return null;
    return <>{pathname.replace("/", "").toUpperCase()}</>;
};

export const ThemeToggle = () => {
    const {theme, setTheme} = useTheme();
    return (
        <button className="px-3 py-2 font-bold tracking-widest text-zinc-400 hover:text-zinc-100 transition-colors"
        onClick={() => console.log("Clicked")}>
            Toggle Theme
        </button>
    );
};
