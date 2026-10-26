// app/fitness/layout.tsx
import { Suspense } from "react";
import FitnessSubNav from "./FitnessSubNav";

export default function FitnessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Suspense fallback={<div className="h-12 border-b border-border/60 bg-background/80" />}>
                <FitnessSubNav />
            </Suspense>
            <div className="flex-1">{children}</div>
        </div>
    );
}