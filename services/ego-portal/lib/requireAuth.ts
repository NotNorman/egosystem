import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export async function requireAuth(callbackUrl: string = "/") {
    // Tells Next.js 16 to wait for an incoming user request before running auth/crypto/DB logic
    await connection();

    const session = await auth();

    if (!session?.user?.id || !session?.user?.name) {
        redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    return {
        userId: session.user.id,
        username: session.user.name,
    };
}