// app/bank/layout.tsx
import { Suspense } from "react";
import BankSubNav from "./BankSubNav";

export default function BankLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Suspense fallback={<div className="h-12 border-b border-border/60 bg-background/80" />}>
                <BankSubNav />
            </Suspense>
            <div className="flex-1">{children}</div>
        </div>
    );
}