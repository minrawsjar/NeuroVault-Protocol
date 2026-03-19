import type { ReactNode } from "react";
import AppNavbar from "@/components/AppNavbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <AppNavbar />
      <main className="pb-8">{children}</main>
    </div>
  );
}
