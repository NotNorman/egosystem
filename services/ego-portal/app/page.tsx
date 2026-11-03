import Link from "next/link";
import ServiceCards from "@/components/ServiceCards";

const EgoPortal = () => {
  const services = [
    {
      title: "Ego Fitness",
      description: "Track workouts, manage gym membership, and see leaderboard rankings.",
      href: "/fitness",
      buttonText: "Enter Fitness",
      titleColor: "text-purple-600 dark:text-purple-400",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      disabled: false,
    },
    {
      title: "Bank of Ego",
      description: "Check balance, transfers, and deposit requests.",
      href: "/bank",
      buttonText: "Enter Banking",
      titleColor: "text-emerald-600 dark:text-emerald-400",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
      disabled: false,
    },
    {
      title: "Ego Gaming",
      description: "Lotto, raffles, and community leaderboards.",
      href: "/gaming",
      buttonText: "Enter Gaming",
      titleColor: "text-rose-600 dark:text-rose-400",
      buttonColor: "bg-rose-600 hover:bg-rose-700",
      disabled: false,
    }
  ];

  return (
    <main className="relative min-h-[calc(100vh-4rem)] bg-background p-8 pt-24 text-foreground flex flex-col items-center justify-start transition-colors">

      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 flex items-center justify-center">
          <span>Ego</span>
          <span className="ml-0.5 px-2.5 pt-1 pb-1.5 rounded-lg bg-zinc-800 text-white dark:bg-white dark:text-zinc-800 leading-none inline-block">
            Hub
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Select a service to enter your dashboard.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {services.map((service, index) => (
          <ServiceCards
            key={index}
            title={service.title}
            description={service.description}
            href={service.href}
            buttonText={service.buttonText}
            titleColor={service.titleColor}
            buttonColor={service.buttonColor}
            disabled={service.disabled}
          />
        ))}
      </div>
    </main>
  );
}

export default EgoPortal;