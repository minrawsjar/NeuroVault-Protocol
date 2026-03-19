import Link from "next/link";

export default function AppOverviewPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-black">Overview</h1>
      <p className="mt-2 text-foreground/70">High-level protocol state and recent activity.</p>
      <Link href="/app" className="mt-6 inline-block text-sm font-bold text-brand-pink hover:underline">
        ← Back to App
      </Link>
    </div>
  );
}
