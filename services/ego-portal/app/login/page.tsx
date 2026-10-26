"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // 1. Import useSearchParams
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Inner form component that reads search parameters
const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 2. Grab the callbackUrl from the URL, or default to "/" if none exists
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid username or password.");
    } else {
      // 3. Redirect back to the original page they were on!
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <Card className="w-full max-w-md bg-background border-border">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-extrabold tracking-tight">
          Ego<span className="ml-0.5 px-1 py-0.5 rounded-sm bg-zinc-800 text-white dark:bg-white dark:text-zinc-800">Auth</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your credentials to access your dashboard
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

// 4. Wrap in Suspense (Next.js requirement when using useSearchParams)
const LoginPage = () => {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background p-6 text-foreground flex items-center justify-center transition-colors">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
};

export default LoginPage;