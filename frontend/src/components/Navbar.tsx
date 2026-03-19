"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import NeuroVaultLogo from "./Logo";

const navLinks = [
  { href: "#hero", label: "Home" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#treasury", label: "Treasury" },
  { href: "#governance", label: "Governance" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldHideNavbar = pathname.startsWith("/app");

  useEffect(() => {
    if (shouldHideNavbar) {
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldHideNavbar]);

  // Hide navbar on app page
  if (shouldHideNavbar) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-lg border-b border-gray-800 py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="#hero" className="flex items-center gap-2 group">
          <NeuroVaultLogo className="w-8 h-8 text-white" />
          <span className="text-lg font-semibold text-white tracking-tight">
            NEUROVAULT
          </span>
        </Link>

        {/* Desktop Navigation - Centered like RAAD */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors tracking-wide"
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </div>

        {/* Right side button - RAAD style */}
        <div className="hidden md:flex items-center">
          <Link
            href="/app"
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide hover:bg-gray-200 transition-all"
          >
            Launch App
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-gray-800">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/app"
              className="bg-white text-black text-center py-3 rounded-full font-medium mt-4 flex items-center justify-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Launch App
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
