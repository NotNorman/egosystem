// app/profile/actions.ts
"use server";

import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface ActionState {
    error?: string;
    success?: string;
}

export async function updateUsernameAction(
    prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "You must be logged in to change your username." };
    }

    const rawUsername = (formData.get("newUsername") as string)?.trim();
    const currentPassword = formData.get("currentPassword") as string;

    if (!rawUsername || !currentPassword) {
        return { error: "Both new username and current password are required." };
    }

    // Validate format: 3-20 chars, letters, numbers, underscores
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(rawUsername)) {
        return {
            error: "Username must be 3–20 characters and contain only letters, numbers, or underscores.",
        };
    }

    const newUsername = rawUsername;

    try {
        // 1. Verify current user & password
        const userResult = await pool.query(
            "SELECT username, password FROM user_data WHERE id = $1 LIMIT 1",
            [session.user.id]
        );
        const user = userResult.rows[0];

        if (!user) {
            return { error: "User account not found." };
        }

        if (user.username === newUsername) {
            return { error: "That is already your current username." };
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { error: "Incorrect password." };
        }

        // 2. Check if the username is already taken by someone else (case-insensitive)
        const existingUser = await pool.query(
            "SELECT id FROM user_data WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1",
            [newUsername, session.user.id]
        );

        if (existingUser.rows.length > 0) {
            return { error: "That username is already taken." };
        }

        // 3. Update the username in PostgreSQL
        await pool.query(
            "UPDATE user_data SET username = $1 WHERE id = $2",
            [newUsername, session.user.id]
        );

        // 4. Refresh the server components so the new username shows right away
        revalidatePath("/", "layout");

        return {
            success: `Username updated to "${newUsername}"! Use this new username next time you log in.`,
        };
    } catch (error) {
        console.error("Failed to update username:", error);
        return { error: "Database error occurred while updating username." };
    }
}

export async function updatePasswordAction(
    prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "You must be logged in to change your password." };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All password fields are required." };
    }

    if (newPassword !== confirmPassword) {
        return { error: "New passwords do not match." };
    }

    if (newPassword.length < 3) {
        return { error: "New password must be at least 3 characters long." };
    }

    if (currentPassword === newPassword) {
        return { error: "New password must be different from your current password." };
    }

    try {
        // 1. Fetch the user's current password from PostgreSQL
        const result = await pool.query(
            "SELECT password FROM user_data WHERE id = $1 LIMIT 1",
            [session.user.id]
        );

        const user = result.rows[0];
        if (!user) {
            return { error: "User account not found." };
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { error: "Your current password is incorrect." };
        }

        // 2. Hash and update the password in PostgreSQL
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            "UPDATE user_data SET password = $1 WHERE id = $2",
            [newPasswordHash, session.user.id]
        );

        return { success: "Password updated successfully!" };
    } catch (error) {
        console.error("Failed to update password:", error);
        return { error: "Database error occurred while updating password." };
    }
}