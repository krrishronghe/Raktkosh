"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Database,
  GitPullRequest,
  HeartHandshake,
  Droplet,
  RotateCcw,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Donor Management", href: "/donors", icon: Users },
  { label: "Blood Inventory", href: "/inventory", icon: Database },
  { label: "Blood Requests", href: "/requests", icon: GitPullRequest },
  { label: "Donation Records", href: "/donations", icon: HeartHandshake },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleReSeed = async () => {
    if (!confirm("Reset and re-seed database with demonstration data?")) return;
    setSeeding(true);
    setSeedSuccess(false);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess(true);
        setTimeout(() => {
          setSeedSuccess(false);
          window.location.reload();
        }, 1200);
      } else {
        alert(data.error || "Failed to seed database.");
      }
    } catch (err) {
      alert("Error contacting database API.");
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#141212]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#9E9A97] hover:text-[#F5F5F1] focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E50914] to-[#B81D24] shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform duration-200">
                <Droplet className="h-5 w-5 fill-white text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#F5F5F1] group-hover:text-white transition-colors">
                  RAKT<span className="text-[#E50914]">KOSH</span>
                </span>
                <span className="hidden sm:block text-[11px] font-medium tracking-wide text-[#9E9A97] uppercase">
                  Blood Bank Management System
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Action & Live MongoDB Indicator */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#221F1F] border border-white/10 text-xs text-[#9E9A97]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Active</span>
            </div>

            <button
              onClick={handleReSeed}
              disabled={seeding}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#221F1F] hover:bg-[#2B2626] border border-white/10 text-xs font-medium text-[#F5F5F1] transition-colors disabled:opacity-50"
              title="Reset database to realistic demonstration records"
            >
              {seedSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Seeded!</span>
                </>
              ) : (
                <>
                  <RotateCcw className={`h-3.5 w-3.5 text-[#E50914] ${seeding ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Reset Demo Data</span>
                  <span className="sm:hidden">Reset</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Sub-bar */}
        <div className="hidden lg:block border-t border-white/5 bg-[#181515]">
          <div className="mx-auto flex max-w-7xl space-x-1 px-4 sm:px-6 lg:px-8">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                    isActive
                      ? "border-[#E50914] text-white bg-white/[0.03]"
                      : "border-transparent text-[#9E9A97] hover:text-[#F5F5F1] hover:border-white/20"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#E50914]" : "text-[#9E9A97]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="fixed inset-y-0 left-0 w-72 bg-[#1A1717] border-r border-white/10 p-5 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E50914]">
                    <Droplet className="h-4 w-4 fill-white text-white" />
                  </div>
                  <span className="text-lg font-bold text-[#F5F5F1]">RAKTKOSH</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#9E9A97] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#E50914] text-white shadow-lg shadow-red-900/40"
                          : "text-[#9E9A97] hover:bg-[#221F1F] hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-[#9E9A97]">
              <p>Raktkosh Blood Bank System</p>
              <p className="mt-1 text-[11px] text-zinc-500">Persistent MongoDB v8</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
