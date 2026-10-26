// app/fitness/stats/FitnessStatsClient.tsx
"use client";

import { useState, useMemo } from "react";
import {
    CalendarDays,
    Dumbbell,
    Flame,
    Clock,
    Trophy,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Waves,
    Zap,
    Timer,
    Maximize2,
    X,
    Activity,
} from "lucide-react";

export interface RowingInterval {
    minute: string;
    watts: number;
    spm: number;
    meters: number;
}

export interface RowingTelemetryPoint {
    elapsedSeconds: number;
    speedMs: number;
    watts: number;
    spm: number;
    distanceMeters: number;
}

export interface WorkoutSession {
    id: number;
    date: string;
    isoDate: string;
    category: "Rowing" | "Strength";
    title: string;
    durationMinutes: number;
    rowingDetails?: {
        totalDistanceMeters: number;
        avgSplit500m: string;
        avgSpeedMs: number;
        avgStrokeRate: number;
        calories: number;
        intervals: RowingInterval[];
        telemetry2s?: RowingTelemetryPoint[];
    };
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    // Streaks
    currentStreakDays: number;
    bestStreakDays: number;
    // Combined Workout Time (Rowing + Strength)
    monthlyMinutes: number;
    allTimeMinutes: number;
    // Rowing Distance (Meters)
    monthlyRowingMeters: number;
    allTimeRowingMeters: number;
    isCurrentUser?: boolean;
}

interface FitnessStatsClientProps {
    username: string;
    workouts: WorkoutSession[];
    leaderboard: LeaderboardEntry[];
}

export default function FitnessStatsClient({
    username,
    workouts,
    leaderboard,
}: FitnessStatsClientProps) {
    const firstRowingId = workouts.find((w) => w.category === "Rowing")?.id ?? null;
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(firstRowingId);

    const [deepDiveWorkout, setDeepDiveWorkout] = useState<WorkoutSession | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // 2-Level Leaderboard State:
    // 1. Timeframe Scope: "monthly" | "allTime"
    const [leaderboardScope, setLeaderboardScope] = useState<"monthly" | "allTime">("monthly");
    // 2. Metric Type: "minutes" (Combined) | "distance" (Rowing) | "streak"
    const [leaderboardMetric, setLeaderboardMetric] = useState<"minutes" | "distance" | "streak">(
        "minutes"
    );

    const sortedLeaderboard = useMemo(() => {
        return [...leaderboard].sort((a, b) => {
            if (leaderboardMetric === "minutes") {
                return leaderboardScope === "monthly"
                    ? b.monthlyMinutes - a.monthlyMinutes
                    : b.allTimeMinutes - a.allTimeMinutes;
            }
            if (leaderboardMetric === "distance") {
                return leaderboardScope === "monthly"
                    ? b.monthlyRowingMeters - a.monthlyRowingMeters
                    : b.allTimeRowingMeters - a.allTimeRowingMeters;
            }
            // Streak
            return leaderboardScope === "monthly"
                ? b.currentStreakDays - a.currentStreakDays
                : b.bestStreakDays - a.bestStreakDays;
        });
    }, [leaderboard, leaderboardScope, leaderboardMetric]);

    const toggleRowingWorkout = (workout: WorkoutSession) => {
        if (workout.category !== "Rowing") return;
        setSelectedWorkoutId((prev) => (prev === workout.id ? null : workout.id));
    };

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const workoutsThisMonth = workouts.filter((w) => w.isoDate.startsWith(currentYearMonth));

    const formatDistance = (meters: number) => {
        if (meters >= 10000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${meters.toLocaleString()} m`;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                    {username}&apos;s Fitness Statistics
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Click your monthly calendar card to review training days, or select a rowing session for telemetry.
                </p>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CLICKABLE CALENDAR CARD */}
                <button
                    type="button"
                    onClick={() => setIsCalendarOpen(true)}
                    className="rounded-xl border border-border bg-card p-5 shadow-sm text-left transition-all hover:border-primary/60 hover:bg-muted/20 group cursor-pointer"
                >
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider group-hover:text-foreground transition-colors">
                            Workouts This Month
                        </span>
                        <CalendarDays className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-3xl font-extrabold">{workoutsThisMonth.length}</p>
                    <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                        <span>Click to open workout calendar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                </button>

                {/* Active Streak */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">
                            Active Streak
                        </span>
                        <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-3xl font-extrabold">4 Days</p>
                    <p className="text-xs text-muted-foreground mt-1">Keep the momentum going!</p>
                </div>

                {/* Equipment Breakdown */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">
                            Training Split
                        </span>
                        <Dumbbell className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xl font-bold truncate mt-1">Bench, Dumbbells & Row</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {workouts.filter((w) => w.category === "Rowing").length} Rowing /{" "}
                        {workouts.filter((w) => w.category === "Strength").length} Strength
                    </p>
                </div>
            </div>

            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Columns: Recent Workout Sessions */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Recent Workout Sessions</h2>
                            <p className="text-xs text-muted-foreground">
                                Rowing sessions include 2-second interval telemetry; strength tracks duration.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {workouts.map((workout) => {
                            const isRowing = workout.category === "Rowing";
                            const isExpanded = isRowing && selectedWorkoutId === workout.id;

                            return (
                                <div
                                    key={workout.id}
                                    className={`rounded-xl border transition-all overflow-hidden ${
                                        isExpanded
                                            ? "border-primary/60 bg-muted/20 shadow-sm"
                                            : "border-border"
                                    }`}
                                >
                                    <div
                                        onClick={() => isRowing && toggleRowingWorkout(workout)}
                                        className={`w-full p-4 flex items-center justify-between gap-3 text-left ${
                                            isRowing
                                                ? "cursor-pointer hover:bg-muted/30 transition-colors"
                                                : "cursor-default"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isRowing
                                                        ? "bg-sky-500/15 text-sky-500"
                                                        : "bg-emerald-500/15 text-emerald-500"
                                                }`}
                                            >
                                                {isRowing ? (
                                                    <Waves className="w-5 h-5" />
                                                ) : (
                                                    <Dumbbell className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-foreground truncate">
                                                        {workout.title}
                                                    </p>
                                                    {isRowing && (
                                                        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                                                            Telemetry Available
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    {workout.date}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-foreground">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                {workout.durationMinutes} min
                                            </span>
                                            {isRowing ? (
                                                isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                )
                                            ) : (
                                                <div className="w-4" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details Drawer (Rowing Only) */}
                                    {isExpanded && workout.rowingDetails && (
                                        <div className="px-4 pb-4 pt-2 border-t border-border/60 bg-background/50 space-y-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                                                <div className="p-2.5 rounded-lg bg-muted/60 border border-border/50">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Distance
                                                    </p>
                                                    <p className="text-sm font-bold">
                                                        {workout.rowingDetails.totalDistanceMeters.toLocaleString()} m
                                                    </p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-muted/60 border border-border/50">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Avg Speed
                                                    </p>
                                                    <p className="text-sm font-bold">
                                                        {workout.rowingDetails.avgSpeedMs.toFixed(2)} m/s
                                                    </p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-muted/60 border border-border/50">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Avg 500m Split
                                                    </p>
                                                    <p className="text-sm font-bold">
                                                        {workout.rowingDetails.avgSplit500m}
                                                    </p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-muted/60 border border-border/50">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Stroke Rate
                                                    </p>
                                                    <p className="text-sm font-bold">
                                                        {workout.rowingDetails.avgStrokeRate} s/m
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-lg border border-border/60 bg-card">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                    <span className="text-xs font-semibold flex items-center gap-1.5">
                                                        <Zap className="w-3.5 h-3.5 text-sky-500" />
                                                        5-Minute Split Overview
                                                    </span>

                                                    {workout.rowingDetails.telemetry2s && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeepDiveWorkout(workout)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors cursor-pointer shadow-xs"
                                                        >
                                                            <Maximize2 className="w-3 h-3" />
                                                            <span>Explore 2s High-Res Graph</span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="h-32 flex items-end gap-2 sm:gap-4 pt-6 px-2 border-b border-border">
                                                    {workout.rowingDetails.intervals.map((interval) => {
                                                        const maxWatts = 240;
                                                        const heightPercent = Math.min(
                                                            100,
                                                            Math.round((interval.watts / maxWatts) * 100)
                                                        );

                                                        return (
                                                            <div
                                                                key={interval.minute}
                                                                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                                                            >
                                                                <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground">
                                                                    {interval.watts}W
                                                                </span>
                                                                <div
                                                                    style={{ height: `${heightPercent}%` }}
                                                                    className="w-full max-w-10 rounded-t-md bg-sky-500/80 group-hover:bg-sky-400 transition-all"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-4 pt-2 px-2">
                                                    {workout.rowingDetails.intervals.map((interval) => (
                                                        <div key={interval.minute} className="flex-1 text-center">
                                                            <p className="text-[10px] font-medium text-foreground">
                                                                {interval.minute}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground">
                                                                {interval.spm} spm
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: 2-Tier Leaderboard */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                    {/* Top Row: Title + Monthly / All-Time Scope Toggle */}
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                            <span>Leaderboard</span>
                        </h2>

                        {/* Scope Pill: Monthly vs All-Time */}
                        <div className="inline-flex rounded-lg bg-muted p-0.5 border border-border/60">
                            <button
                                type="button"
                                onClick={() => setLeaderboardScope("monthly")}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                    leaderboardScope === "monthly"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setLeaderboardScope("allTime")}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                    leaderboardScope === "allTime"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                All-Time
                            </button>
                        </div>
                    </div>

                    {/* Second Row: Category Selector (Total Time | Row Distance | Streak) */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted">
                        <button
                            type="button"
                            onClick={() => setLeaderboardMetric("minutes")}
                            className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                leaderboardMetric === "minutes"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Timer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Time</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setLeaderboardMetric("distance")}
                            className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                leaderboardMetric === "distance"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Waves className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span>Row Dist</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setLeaderboardMetric("streak")}
                            className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                leaderboardMetric === "streak"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>Streak</span>
                        </button>
                    </div>

                    {/* Subtitle explaining current view */}
                    <p className="text-[11px] text-muted-foreground">
                        {leaderboardMetric === "minutes" &&
                            (leaderboardScope === "monthly"
                                ? "Combined strength & rowing time this month"
                                : "All-time combined training time")}
                        {leaderboardMetric === "distance" &&
                            (leaderboardScope === "monthly"
                                ? "Total meters rowed this month"
                                : "All-time total meters rowed")}
                        {leaderboardMetric === "streak" &&
                            (leaderboardScope === "monthly"
                                ? "Current active workout streak"
                                : "All-time longest workout streak")}
                    </p>

                    {/* Leaderboard Rows */}
                    <div className="divide-y divide-border border-t border-border">
                        {sortedLeaderboard.map((entry, idx) => {
                            const displayRank = idx + 1;

                            // Compute displayed metric string
                            let metricValue = "";
                            if (leaderboardMetric === "minutes") {
                                const mins =
                                    leaderboardScope === "monthly"
                                        ? entry.monthlyMinutes
                                        : entry.allTimeMinutes;
                                metricValue =
                                    leaderboardScope === "allTime"
                                        ? `${(mins / 60).toFixed(1)}h (${mins}m)`
                                        : `${mins} min`;
                            } else if (leaderboardMetric === "distance") {
                                const meters =
                                    leaderboardScope === "monthly"
                                        ? entry.monthlyRowingMeters
                                        : entry.allTimeRowingMeters;
                                metricValue = formatDistance(meters);
                            } else {
                                const days =
                                    leaderboardScope === "monthly"
                                        ? entry.currentStreakDays
                                        : entry.bestStreakDays;
                                metricValue = `${days}d 🔥`;
                            }

                            return (
                                <div
                                    key={entry.username}
                                    className={`py-3 flex items-center justify-between gap-2 ${
                                        entry.isCurrentUser
                                            ? "bg-primary/5 -mx-2 px-2 rounded-lg"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                displayRank === 1
                                                    ? "bg-amber-500/20 text-amber-500"
                                                    : displayRank === 2
                                                    ? "bg-zinc-400/20 text-zinc-400"
                                                    : displayRank === 3
                                                    ? "bg-amber-700/20 text-amber-600"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {displayRank}
                                        </span>
                                        <span className="text-sm font-semibold truncate">
                                            {entry.username}
                                            {entry.isCurrentUser && (
                                                <span className="ml-1.5 text-[10px] font-normal text-primary">
                                                    (You)
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <span className="text-xs font-mono font-semibold shrink-0">
                                        {metricValue}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL 1: Fixed-Size Interactive Workout History Calendar */}
            {isCalendarOpen && (
                <WorkoutCalendarModal
                    workouts={workouts}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}

            {/* MODAL 2: 2-Second High-Resolution Rowing Telemetry Graph */}
            {deepDiveWorkout && deepDiveWorkout.rowingDetails?.telemetry2s && (
                <RowingDeepDiveModal
                    workout={deepDiveWorkout}
                    onClose={() => setDeepDiveWorkout(null)}
                />
            )}
        </div>
    );
}

/* ============================================================================
 * SUB-COMPONENT 1: Locked-Height Monthly Calendar Modal (No Jumping Buttons!)
 * ========================================================================== */
function WorkoutCalendarModal({
    workouts,
    onClose,
}: {
    workouts: WorkoutSession[];
    onClose: () => void;
}) {
    const [viewDate, setViewDate] = useState(() => new Date(2026, 9, 1));
    const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const monthName = viewDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    // Always pad to 42 total cells (6 rows × 7 days) so the calendar grid NEVER changes height!
    const totalGridSlots = 42;
    const trailingEmptySlots = totalGridSlots - (firstDayOfWeek + daysInMonth);

    const workoutsByDate = useMemo(() => {
        const map = new Map<string, WorkoutSession[]>();
        for (const w of workouts) {
            const list = map.get(w.isoDate) || [];
            list.push(w);
            map.set(w.isoDate, list);
        }
        return map;
    }, [workouts]);

    const prevMonth = () => {
        setSelectedDayIso(null);
        setViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setSelectedDayIso(null);
        setViewDate(new Date(year, month + 1, 1));
    };

    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const viewedMonthWorkouts = workouts.filter((w) => w.isoDate.startsWith(monthPrefix));

    const selectedDayWorkouts = selectedDayIso ? workoutsByDate.get(selectedDayIso) || [] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            <span>Workout Attendance Calendar</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Browse current and previous months to see every day you trained.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Month Navigation Header — Stays 100% locked in place */}
                <div className="flex items-center justify-between px-1">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer shrink-0"
                        title="Previous Month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-center w-48">
                        <p className="text-base font-bold truncate">{monthName}</p>
                        <p className="text-xs text-muted-foreground">
                            {viewedMonthWorkouts.length} workout{" "}
                            {viewedMonthWorkouts.length === 1 ? "session" : "sessions"} this month
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer shrink-0"
                        title="Next Month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted-foreground">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d} className="py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Fixed 6-Row Calendar Grid (42 slots always) */}
                <div className="grid grid-cols-7 gap-1.5">
                    {/* Leading Empty Slots */}
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                        <div key={`lead-empty-${idx}`} className="h-10 rounded-lg" />
                    ))}

                    {/* Actual Days of Month */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNumber = idx + 1;
                        const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                            dayNumber
                        ).padStart(2, "0")}`;
                        const dayWorkouts = workoutsByDate.get(iso) || [];
                        const hasRowing = dayWorkouts.some((w) => w.category === "Rowing");
                        const hasStrength = dayWorkouts.some((w) => w.category === "Strength");
                        const isSelected = selectedDayIso === iso;

                        let badgeStyle =
                            "bg-muted/30 text-muted-foreground hover:bg-muted/60 border-transparent";
                        if (hasRowing && hasStrength) {
                            badgeStyle =
                                "bg-primary/20 text-primary border-primary/50 font-bold hover:bg-primary/30";
                        } else if (hasRowing) {
                            badgeStyle =
                                "bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold hover:bg-sky-500/30";
                        } else if (hasStrength) {
                            badgeStyle =
                                "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold hover:bg-emerald-500/30";
                        }

                        return (
                            <button
                                key={iso}
                                type="button"
                                onClick={() => setSelectedDayIso(iso)}
                                className={`h-10 rounded-lg border text-xs flex flex-col items-center justify-center relative transition-all cursor-pointer ${badgeStyle} ${
                                    isSelected ? "ring-2 ring-primary scale-105" : ""
                                }`}
                            >
                                <span>{dayNumber}</span>
                                {dayWorkouts.length > 0 && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {hasRowing && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                        )}
                                        {hasStrength && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    {/* Trailing Empty Slots so total is always 42 */}
                    {Array.from({ length: Math.max(0, trailingEmptySlots) }).map((_, idx) => (
                        <div key={`trail-empty-${idx}`} className="h-10 rounded-lg" />
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        Rowing
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        Strength (Bench/DB)
                    </span>
                </div>

                {/* Fixed-Height Selected Day Box so clicking a day never shifts the modal either */}
                <div className="h-24 p-3 rounded-xl bg-muted/50 border border-border overflow-y-auto flex flex-col justify-center">
                    {!selectedDayIso ? (
                        <p className="text-xs text-muted-foreground text-center">
                            Select any date above to view logged workout sessions.
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-muted-foreground">
                                Sessions on {selectedDayIso}:
                            </p>
                            {selectedDayWorkouts.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    Rest day — no workouts logged.
                                </p>
                            ) : (
                                selectedDayWorkouts.map((w) => (
                                    <div
                                        key={w.id}
                                        className="flex items-center justify-between text-xs font-medium bg-card px-2.5 py-1.5 rounded-lg border border-border"
                                    >
                                        <span className="font-bold truncate">{w.title}</span>
                                        <span className="font-mono text-muted-foreground shrink-0 ml-2">
                                            {w.durationMinutes} min
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
 * SUB-COMPONENT 2: 2-Second High-Resolution Rowing Telemetry Modal
 * ========================================================================== */
function RowingDeepDiveModal({
    workout,
    onClose,
}: {
    workout: WorkoutSession;
    onClose: () => void;
}) {
    const telemetry = workout.rowingDetails?.telemetry2s || [];
    const [metric, setMetric] = useState<"speedMs" | "watts" | "spm">("speedMs");
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (telemetry.length === 0) return null;

    const values = telemetry.map((t) => t[metric]);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = Math.max(maxVal - minVal, 0.5);

    const width = 700;
    const height = 220;
    const points = telemetry
        .map((pt, idx) => {
            const x = (idx / Math.max(telemetry.length - 1, 1)) * width;
            const y = height - ((pt[metric] - minVal) / range) * (height - 30) - 15;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;
    const activePoint = hoverIndex !== null ? telemetry[hoverIndex] : telemetry[telemetry.length - 1];

    const metricLabel =
        metric === "speedMs"
            ? "Boat Speed (m/s)"
            : metric === "watts"
            ? "Power Output (Watts)"
            : "Stroke Rate (SPM)";

    const formatElapsed = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-sky-500" />
                            <h3 className="text-lg font-bold">{workout.title} — 2s Telemetry</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            High-resolution sensor stream recorded every 2 seconds ({workout.date})
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setMetric("speedMs")}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                metric === "speedMs"
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Speed (m/s)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetric("watts")}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                metric === "watts"
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Power (Watts)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetric("spm")}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                                metric === "spm"
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Stroke Rate (SPM)
                        </button>
                    </div>

                    {activePoint && (
                        <div className="flex items-center gap-4 text-xs font-mono bg-muted/60 px-3.5 py-2 rounded-lg border border-border">
                            <span>
                                Time: <strong>{formatElapsed(activePoint.elapsedSeconds)}</strong>
                            </span>
                            <span>
                                Speed: <strong className="text-sky-400">{activePoint.speedMs.toFixed(2)} m/s</strong>
                            </span>
                            <span>
                                Power: <strong className="text-amber-400">{activePoint.watts} W</strong>
                            </span>
                            <span>
                                Rate: <strong className="text-emerald-400">{activePoint.spm} spm</strong>
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-4 rounded-xl border border-border bg-background/60">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="font-semibold text-foreground">{metricLabel}</span>
                        <span>Hover across the graph to inspect 2-second samples</span>
                    </div>

                    <div className="relative w-full h-56 select-none">
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full h-full overflow-visible"
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            <defs>
                                <linearGradient id="rowingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(14, 165, 233)" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="rgb(14, 165, 233)" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            <polygon points={areaPoints} fill="url(#rowingAreaGrad)" />

                            <polyline
                                fill="none"
                                stroke="rgb(14, 165, 233)"
                                strokeWidth="2.5"
                                points={points}
                            />

                            {hoverIndex !== null && telemetry[hoverIndex] && (
                                <>
                                    <line
                                        x1={(hoverIndex / Math.max(telemetry.length - 1, 1)) * width}
                                        y1={0}
                                        x2={(hoverIndex / Math.max(telemetry.length - 1, 1)) * width}
                                        y2={height}
                                        stroke="currentColor"
                                        strokeDasharray="4 4"
                                        className="text-muted-foreground/60"
                                    />
                                    <circle
                                        cx={(hoverIndex / Math.max(telemetry.length - 1, 1)) * width}
                                        cy={
                                            height -
                                            ((telemetry[hoverIndex][metric] - minVal) / range) *
                                                (height - 30) -
                                            15
                                        }
                                        r="5"
                                        className="fill-sky-400 stroke-background stroke-2"
                                    />
                                </>
                            )}

                            {telemetry.map((pt, idx) => {
                                const colWidth = width / telemetry.length;
                                return (
                                    <rect
                                        key={pt.elapsedSeconds}
                                        x={idx * colWidth}
                                        y={0}
                                        width={colWidth + 1}
                                        height={height}
                                        fill="transparent"
                                        className="cursor-crosshair"
                                        onMouseEnter={() => setHoverIndex(idx)}
                                    />
                                );
                            })}
                        </svg>
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border">
                        <span>0:00</span>
                        <span>
                            {formatElapsed(
                                telemetry[Math.floor(telemetry.length / 2)]?.elapsedSeconds || 0
                            )}
                        </span>
                        <span>
                            {formatElapsed(telemetry[telemetry.length - 1]?.elapsedSeconds || 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}