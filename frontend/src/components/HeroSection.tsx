"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import NeuroVaultLogo from "./Logo";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = heroRef.current?.querySelectorAll(".animate-item");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* Background image */}
        <Image
          src="/hero-bg.png"
          alt="Neural blockchain connection"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-24">
        {/* Logo Mark */}
        <div className="animate-item opacity-0 translate-y-4 transition-all duration-700 mb-8">
          <div className="inline-flex items-center justify-center p-4 border border-white/20 rounded-2xl">
            <NeuroVaultLogo className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Small label */}
        <div className="animate-item opacity-0 translate-y-4 transition-all duration-700 delay-100 mb-8">
          <span className="text-sm tracking-[0.3em] uppercase text-gray-400">
            AI-Powered Treasury Protocol
          </span>
        </div>

        {/* Main headline - RAAD style */}
        <h1 className="animate-item opacity-0 translate-y-4 transition-all duration-700 delay-200 text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter mb-8 uppercase leading-[0.9]">
          Autonomous Treasury
          <br />
          Management Agent
        </h1>

        {/* Subtitle */}
        <p className="animate-item opacity-0 translate-y-4 transition-all duration-700 delay-300 text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
          NeuroVault combines Claude AI reasoning with on-chain governance to create a 
          self-managing treasury that grows 24/7.
        </p>

        {/* CTA Button - RAAD style */}
        <div className="animate-item opacity-0 translate-y-4 transition-all duration-700 delay-400">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-white text-black px-10 py-5 rounded-full text-lg font-bold uppercase tracking-wider hover:bg-gray-100 transition-all shadow-2xl shadow-white/10"
          >
            Launch App
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Dashboard Preview - Similar to RAAD's product screenshot */}
      <div className="animate-item opacity-0 translate-y-4 transition-all duration-1000 delay-500 relative z-10 mt-16 w-full max-w-5xl mx-auto px-6">
        <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-black/50 backdrop-blur-sm p-2">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-700" />
              <div className="w-3 h-3 rounded-full bg-gray-700" />
              <div className="w-3 h-3 rounded-full bg-gray-700" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-gray-600">app.neurovault.eth</span>
            </div>
          </div>
          {/* Dashboard mockup content */}
          <div className="p-6 grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="h-32 bg-gray-900/50 rounded-xl border border-gray-800" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-900/50 rounded-xl border border-gray-800" />
                <div className="h-24 bg-gray-900/50 rounded-xl border border-gray-800" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-900/50 rounded-xl border border-gray-800" />
              <div className="h-20 bg-gray-900/50 rounded-xl border border-gray-800" />
              <div className="h-20 bg-gray-900/50 rounded-xl border border-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gray-500 to-transparent" />
      </div>
    </section>
  );
}
