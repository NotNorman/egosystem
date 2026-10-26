// app/fitness/stats/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import FitnessStatsClient, { WorkoutSession, LeaderboardEntry } from "./FitnessStatsClient";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { 
    CalendarDays, 
    Dumbbell, 
    TrendingUp, 
    Activity, 
    ArrowRight 
} from "lucide-react";

export const metadata: Metadata = {
    title: "Fitness Statistics | Ego Fitness",
    description: "Track your workout history, consistency streaks, and exercise breakdown.",
};

// 1. Dynamic Server Component that checks login status
const FitnessStatsContent = async () => {
    await connection();
    const session = await auth();

    // If NOT logged in -> Show the public informational preview page
    if (!session?.user?.id) {
        return <GuestStatsOverview />;
    }

    // If logged in -> Show the user's actual interactive stats dashboard
    return (
        <AuthenticatedStatsDashboard 
            userId={session.user.id} 
            username={session.user.name || "Athlete"} 
        />
    );
};

// 2. Guest View: Explains what the page does and invites them to log in
function GuestStatsOverview() {
    const features = [
        {
            icon: CalendarDays,
            title: "Workout Calendar & Streaks",
            description:
                "See exactly which days you checked in and worked out, track your weekly consistency, and build active streaks.",
        },
        {
            icon: Dumbbell,
            title: "Workout Type Breakdown",
            description:
                "Categorize and review your sessions—from Upper/Lower strength splits and bench press sets to rowing and cardio.",
        },
        {
            icon: TrendingUp,
            title: "Progress & Volume Metrics",
            description:
                "Visualize your total time trained, personal records, and progression trends over weeks and months.",
        },
    ];

    return (
        <div className="max-w-5xl mx-auto py-8">
            {/* Hero Banner */}
            <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Ego Fitness Analytics</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                    Track Every Rep, Session, and Streak.
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Your personal fitness command center. Log in to review which days you trained, 
                    break down your workout routines, and monitor your long-term progress.
                </p>

                <Link
                    href={`/login?callbackUrl=${encodeURIComponent("/fitness/stats")}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                    <span>Log in to Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <div
                            key={feature.title}
                            className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <Icon className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold mb-2">{feature.title}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 3. Logged-In View: Shows the user's personal stats (ready to wire up to PostgreSQL)
// Replace AuthenticatedStatsDashboard in app/fitness/stats/page.tsx with:
async function AuthenticatedStatsDashboard({
    userId,
    username,
}: {
    userId: string;
    username: string;
}) {
    // Generate realistic 2-second rowing machine telemetry points
    const sampleTelemetry2s = Array.from({ length: 60 }, (_, i) => {
        const elapsedSeconds = (i + 1) * 2; // 2s, 4s, 6s...
        const wave = Math.sin(i / 4) * 0.25;
        const speedMs = Number((3.6 + wave + (i % 3) * 0.04).toFixed(2));
        const watts = Math.round(165 + wave * 80 + (i % 5) * 3);
        const spm = Math.round(26 + Math.sin(i / 6) * 2);
        return {
            elapsedSeconds,
            speedMs,
            watts,
            spm,
            distanceMeters: Math.round(elapsedSeconds * 3.6),
        };
    });

    const sampleWorkouts: WorkoutSession[] = [
        {
            id: 1,
            date: "Oct 22, 2026",
            isoDate: "2026-10-22",
            category: "Rowing",
            title: "Cardio — 30m Rowing Session",
            durationMinutes: 30,
            rowingDetails: {
                totalDistanceMeters: 6450,
                avgSplit500m: "2:19.5",
                avgSpeedMs: 3.58,
                avgStrokeRate: 26,
                calories: 385,
                intervals: [
                    { minute: "0–5m", watts: 155, spm: 24, meters: 1020 },
                    { minute: "5–10m", watts: 175, spm: 26, meters: 1080 },
                    { minute: "10–15m", watts: 185, spm: 27, meters: 1110 },
                    { minute: "15–20m", watts: 170, spm: 25, meters: 1060 },
                    { minute: "20–25m", watts: 190, spm: 28, meters: 1120 },
                    { minute: "25–30m", watts: 165, spm: 26, meters: 1060 },
                ],
                telemetry2s: sampleTelemetry2s,
            },
        },
        {
            id: 2,
            date: "Oct 20, 2026",
            isoDate: "2026-10-20",
            category: "Strength",
            title: "Strength — Bench & Dumbbells",
            durationMinutes: 55,
        },
        {
            id: 3,
            date: "Oct 18, 2026",
            isoDate: "2026-10-18",
            category: "Rowing",
            title: "Cardio — 20m Tempo Row",
            durationMinutes: 20,
            rowingDetails: {
                totalDistanceMeters: 4320,
                avgSplit500m: "2:18.8",
                avgSpeedMs: 3.6,
                avgStrokeRate: 27,
                calories: 260,
                intervals: [
                    { minute: "0–5m", watts: 165, spm: 25, meters: 1050 },
                    { minute: "5–10m", watts: 180, spm: 27, meters: 1090 },
                    { minute: "10–15m", watts: 185, spm: 28, meters: 1100 },
                    { minute: "15–20m", watts: 175, spm: 26, meters: 1080 },
                ],
                telemetry2s: sampleTelemetry2s.slice(0, 45),
            },
        },
        {
            id: 4,
            date: "Sep 28, 2026",
            isoDate: "2026-09-28",
            category: "Strength",
            title: "Strength — Bench & Dumbbells",
            durationMinutes: 45,
        },
    ];

    const sampleLeaderboard: LeaderboardEntry[] = [
        {
            rank: 1,
            username,
            currentStreakDays: 4,
            bestStreakDays: 11,
            monthlyMinutes: 105,
            allTimeMinutes: 1420,
            monthlyRowingMeters: 10770,
            allTimeRowingMeters: 84500,
            isCurrentUser: true,
        },
        {
            rank: 2,
            username: "alex_lifts",
            currentStreakDays: 9,
            bestStreakDays: 14,
            monthlyMinutes: 420,
            allTimeMinutes: 3180,
            monthlyRowingMeters: 18400,
            allTimeRowingMeters: 126000,
        },
        {
            rank: 3,
            username: "row_master",
            currentStreakDays: 6,
            bestStreakDays: 19,
            monthlyMinutes: 510,
            allTimeMinutes: 4890,
            monthlyRowingMeters: 62500,
            allTimeRowingMeters: 412000,
        },
        {
            rank: 4,
            username: "iron_ego",
            currentStreakDays: 2,
            bestStreakDays: 7,
            monthlyMinutes: 190,
            allTimeMinutes: 950,
            monthlyRowingMeters: 4200,
            allTimeRowingMeters: 31000,
        },
    ];

    return (
        <FitnessStatsClient
            username={username}
            workouts={sampleWorkouts}
            leaderboard={sampleLeaderboard}
        />
    );
}

// 4. Synchronous Page Entry that wraps FitnessStatsContent in <Suspense>
const FitnessStatsPage = () => {
    return (
        <main className="p-6 md:p-10">
            <Suspense
                fallback={
                    <div className="max-w-5xl mx-auto text-muted-foreground">
                        Loading fitness statistics...
                    </div>
                }
            >
                <FitnessStatsContent />
            </Suspense>
        </main>
    );
};

export default FitnessStatsPage;