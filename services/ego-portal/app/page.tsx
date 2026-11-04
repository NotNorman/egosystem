// app/page.tsx
import Link from "next/link";

// ------------------------------------------------------------------
// TODO [CUSTOM ICONS - STEP 1]: Import your custom logos here later.
// Example: import Image from "next/image";
// Example: import FitnessLogo from "@/public/assets/fitness-logo.svg";
// ------------------------------------------------------------------
import { Dumbbell, Landmark, Coins, ArrowRight, Sparkles } from "lucide-react";

const EgoPortal = () => {
  const services = [
    {
      id: "01",
      title: "Ego Fitness",
      badge: "ACTIVE",
      description: "Track workouts, manage gym membership, and see leaderboard rankings.",
      features: ["Rowing Telemetry", "NFC Tap-In", "Leaderboards"],
      href: "/fitness",
      buttonText: "Enter Fitness",
      titleColor: "text-purple-500 dark:text-purple-400",
      cardStyle:
        "border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-500/80 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]",
      topHighlight: "from-transparent via-purple-500 to-transparent",
      innerGlow: "from-purple-500/15 via-purple-500/5 to-transparent",
      badgeStyle: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      iconBoxStyle: "bg-purple-500/15 border-purple-500/30 text-purple-400 group-hover:bg-purple-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]",
      arrowBoxStyle: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white",
      
      // ------------------------------------------------------------------
      // TODO [CUSTOM ICONS - STEP 2]: Swap the icon references below.
      // Example: icon: FitnessLogo  (or a static image path if using next/image)
      // ------------------------------------------------------------------
      icon: Dumbbell,
      iconColor: "text-purple-500 dark:text-purple-400",
    },
    {
      id: "02",
      title: "Bank of Ego",
      badge: "SECURE",
      description: "Check balance, transfers, and deposit requests.",
      features: ["Instant Ledger", "P2P Transfers", "Credit Requests"],
      href: "/bank",
      buttonText: "Enter Banking",
      titleColor: "text-emerald-500 dark:text-emerald-400",
      cardStyle:
        "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-emerald-500/80 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]",
      topHighlight: "from-transparent via-emerald-500 to-transparent",
      innerGlow: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      iconBoxStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
      arrowBoxStyle: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white",
      icon: Landmark, // Replace later
      iconColor: "text-emerald-500 dark:text-emerald-400",
    },
    {
      id: "03",
      title: "Ego Gaming",
      badge: "LIVE",
      description: "Lotto, raffles, and community leaderboards.",
      features: ["Crash & Plinko", "Weekly Draws", "High Rollers"],
      href: "/gaming",
      buttonText: "Enter Gaming",
      titleColor: "text-rose-500 dark:text-rose-400",
      cardStyle:
        "border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:border-rose-500/80 hover:shadow-[0_0_40px_rgba(244,63,94,0.3)]",
      topHighlight: "from-transparent via-rose-500 to-transparent",
      innerGlow: "from-rose-500/15 via-rose-500/5 to-transparent",
      badgeStyle: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      iconBoxStyle: "bg-rose-500/15 border-rose-500/30 text-rose-400 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)]",
      arrowBoxStyle: "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white",
      icon: Coins, // Replace later
      iconColor: "text-rose-500 dark:text-rose-400",
    }
  ];

  // Responsive Layout:
  // - Mobile: Uses `pt-12 justify-start` to keep it near the top.
  // - Desktop (md:): Uses `md:pt-0 md:justify-center` to perfectly center vertically.
  return (
    <main className="relative min-h-[calc(100vh-4rem)] bg-background p-6 sm:p-8 pt-12 md:pt-0 pb-16 text-foreground flex flex-col items-center justify-start md:justify-center transition-colors">

      {/* Header Section */}
      <div className="text-center mb-12 md:mb-16 max-w-2xl flex flex-col items-center">

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 flex items-center justify-center">
          <span>Ego</span>
          <span className="ml-1.5 px-3.5 py-1 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 leading-none inline-block shadow-[0_0_25px_rgba(255,255,255,0.4)] dark:shadow-[0_0_25px_rgba(255,255,255,0.6)]">
            Hub
          </span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground font-medium">
          Select a division below to access your live dashboard.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7 w-full max-w-6xl">
        {services.map((service, index) => {
          const IconComponent = service.icon;
          return (
            <Link
              key={index}
              href={service.href}
              className="group relative h-full rounded-3xl transition-all duration-300 hover:-translate-y-2 block focus:outline-none"
            >
              {/* Card Container */}
              <div
                className={`relative h-full p-7 sm:p-8 rounded-3xl bg-card border transition-all duration-300 flex flex-col justify-between overflow-hidden ${service.cardStyle}`}
              >
                {/* 1. Top Edge Laser Highlight Bar */}
                <div
                  className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${service.topHighlight} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* 2. Internal Corner Ambient Glow (illuminates inside of card) */}
                <div
                  className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-radial ${service.innerGlow} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                {/* 3. Background Logo Watermark in Bottom Right Corner */}
                <div className="absolute -right-8 -bottom-8 pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12">
                  {/* 
                    TODO [CUSTOM ICONS - STEP 3]: Update this rendering tag.
                    If using Next.js <Image />, replace <IconComponent ... /> with:
                    <Image src={service.icon} alt={service.title} width={176} height={176} className="..." />
                  */}
                  <IconComponent
                    className={`w-44 h-44 opacity-[0.07] dark:opacity-[0.12] group-hover:opacity-[0.15] dark:group-hover:opacity-[0.22] transition-opacity ${service.iconColor}`}
                  />
                </div>

                {/* Top Content Area */}
                <div className="relative z-10">
                  {/* Card Header Row: Icon Box + Status Pill */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 ${service.iconBoxStyle}`}
                    >
                      <IconComponent className="w-6 h-6" strokeWidth={2.2} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${service.badgeStyle}`}
                      >
                        ● {service.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5 ${service.titleColor}`}>
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                {/* Bottom Section: Feature Pills + Action Bar */}
                <div className="relative z-10 mt-auto">
                  {/* Micro Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {service.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-secondary/70 text-secondary-foreground/80 border border-border/60"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Action Callout Bar */}
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between text-base sm:text-lg font-extrabold">
                    <span className={service.titleColor}>{service.buttonText}</span>
                    
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 ${service.arrowBoxStyle}`}
                    >
                      <ArrowRight strokeWidth={3} className="w-5 h-5" />
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          );
        })}
      </div>

    </main>
  );
};

export default EgoPortal;