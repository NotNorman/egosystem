"use client";

import { useRef } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

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

interface HubMenuProps {
    categories: ServiceCategory[];
}

export const HubMenu = ({ categories }: HubMenuProps) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    const handleClose = () => {
        if (detailsRef.current) {
            detailsRef.current.removeAttribute("open");
        }
    };

    return (
        <details ref={detailsRef} className="group">
            <summary className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none cursor-pointer flex items-center justify-center list-none [&::-webkit-details-marker]:hidden">
                <Menu className="w-5 h-5 pointer-events-none" />
            </summary>
            
            <div className="fixed top-14 left-0 w-full bg-background border-b border-border shadow-2xl z-100 cursor-default">
                <div className="w-full max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {categories.map((category, index) => (
                        <div key={index} className="flex flex-col">
                            <Link 
                                href={category.href} 
                                onClick={handleClose}
                                className={`text-m font-bold ${category.titleColor} mb-4 uppercase tracking-widest border-b border-border pb-2`}
                            >
                                {category.title}
                            </Link>
                            
                            <div className="flex flex-col space-y-3">
                                {category.services.length > 0 ? (
                                    category.services.map((service, sIndex) => (
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
                                        {category.fallbackText || "Coming soon..."}
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