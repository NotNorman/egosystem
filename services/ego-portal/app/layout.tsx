// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react"; 
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
// 1. Import the visibility wrapper from your client logic file
import { NavbarVisibility } from "@/components/NavBarClientLogic"; 
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
            
            {/* 2. Wrap your Suspense boundary in the Visibility component */}
            <NavbarVisibility>
              <Suspense fallback={<div className="h-14 w-full border-b border-border bg-background" />}>
                <Navbar />
              </Suspense>
            </NavbarVisibility>
            
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}