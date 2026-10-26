// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = (credentials.username as string).toLowerCase();
        const password = credentials.password as string;

        try {
          // 1. Fetch is_admin alongside id, username, and password
          const result = await pool.query(
            "SELECT id, username, password, is_admin FROM user_data WHERE lower(username) = $1 LIMIT 1",
            [username]
          );

          const user = result.rows[0];
          if (!user) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          // 2. Return isAdmin in the user object
          return {
            id: String(user.id),
            name: user.username,
            isAdmin: Boolean(user.is_admin),
          };
        } catch (error) {
          console.error("Database auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 3. Persist isAdmin into the encrypted JWT cookie on login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      // 4. Expose isAdmin on session.user for your pages & components
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});