import type { Metadata } from "next";
import { Suspense } from "react"; // 1. Import Suspense
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ego Hub",
  description: "Central dashboard for Ego systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" enableSystem defaultTheme="system" >
            <Suspense fallback={<div className="h-14 w-full border-b border-border bg-background" />}>
              <Navbar />
            </Suspense>
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}