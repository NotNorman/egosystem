"use client";
import { useTheme } from "next-themes";
import {Button} from "@/components/ui/button";

export const ThemeToggle = () => {
    const {theme, setTheme} = useTheme();
    return (
        <Button className="px-3 py-2 font-bold tracking-widest text-zinc-400 hover:text-zinc-100 transition-colors"
        onClick={() => console.log('Clicked')}>
            Toggle Theme
        </Button>
    );
};
