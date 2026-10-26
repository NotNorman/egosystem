// app/profile/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAuth } from "@/lib/requireAuth";
import { pool } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
    title: "Profile Settings",
    description: "Manage your EgoHub account information and security.",
};


const ProfileContent = async () => {
    const { userId, username: sessionUsername } = await requireAuth("/profile");

    let currentUsername = sessionUsername;
    let createdAt = "N/A";
    let is_admin = false;

    try {
        // Must select "username" here so revalidatePath fetches the newly saved name!
        const result = await pool.query(
            "SELECT username, created_at, is_admin FROM user_data WHERE id = $1 LIMIT 1",
            [userId]
        );

        const row = result.rows[0];
        if (row) {
            if (row.username) {
                currentUsername = row.username;
            }
            if (row.created_at) {
                createdAt = new Date(row.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            }
            if (row.is_admin){
                is_admin = row.is_admin;
            }
        }
    } catch (error) {
        console.error("Failed to fetch profile info:", error);
    }

    return (
        <ProfileClient
            user={{
                id: userId,
                username: currentUsername,
                createdAt,
                is_admin
            }}
        />
    );
};

const ProfilePage = () => {
    return (
        <main className="p-6 md:p-10">
            <Suspense fallback={<div className="max-w-5xl mx-auto text-muted-foreground">Loading profile...</div>}>
                <ProfileContent />
            </Suspense>
        </main>
    );
};

export default ProfilePage;