import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-6xl font-extrabold tracking-tight text-primary">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">This page cannot be found</h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Return to Ego Hub
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}