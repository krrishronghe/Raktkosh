"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
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
  Sun,
  Moon,
  Activity,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Donor Registry", href: "/donors", icon: Users },
  { label: "Blood Inventory", href: "/inventory", icon: Database },
  { label: "Requisitions", href: "/requests", icon: GitPullRequest },
  { label: "Donation Records", href: "/donations", icon: HeartHandshake },
];

function subscribeTheme(callback: () => void) {
  window.addEventListener("raktkosh-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("raktkosh-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot() {
  return localStorage.getItem("raktkosh-theme") ?? "dark";
}

function getThemeServerSnapshot() {
  return "dark";
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const isDark = theme === "dark";

  // Sync initial theme class to HTML element on mount
  useEffect(() => {
    const currentTheme = localStorage.getItem("raktkosh-theme") ?? "dark";
    if (currentTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    localStorage.setItem("raktkosh-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("raktkosh-theme-change"));
  };

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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-[#141212]/85 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-600 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-[#F5F5F1] rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E50914] via-[#B81D24] to-[#7A0A10] shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
                <Droplet className="h-5 w-5 fill-white text-white drop-shadow" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#141212] animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-[#F5F5F1] group-hover:text-[#E50914] transition-colors">
                  RAKT<span className="text-[#E50914]">KOSH</span>
                </span>
                <span className="hidden sm:block text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-[#9E9A97] uppercase">
                  Bio-Vault Blood Bank System
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Actions: Live MongoDB Pill, Theme Switcher, and Reset */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Real-time DB Status */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#221F1F] border border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-[#9E9A97]">
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">MongoDB 8.3 Active</span>
            </div>

            {/* Dark / Light Mode Toggle Button */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-100 dark:bg-[#221F1F] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-amber-400 hover:border-zinc-300 dark:hover:border-white/20 transition-all hover:scale-105"
                title={isDark ? "Switch to Clinical Light Mode" : "Switch to Obsidian Dark Mode"}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
                ) : (
                  <Moon className="h-4 w-4 text-zinc-700 transition-transform" />
                )}
              </button>
            )}

            {/* Reset Demo Data Button */}
            <button
              onClick={handleReSeed}
              disabled={seeding}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#221F1F] hover:bg-zinc-200 dark:hover:bg-[#2B2626] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-[#F5F5F1] transition-all disabled:opacity-50"
              title="Reset database to verified operational demonstration data"
            >
              {seedSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Seeded!</span>
                </>
              ) : (
                <>
                  <RotateCcw className={`h-3.5 w-3.5 text-[#E50914] ${seeding ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Reset Demo</span>
                  <span className="sm:hidden">Reset</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Sub-bar with 3D Indicator */}
        <div className="hidden lg:block border-t border-zinc-200/80 dark:border-white/5 bg-zinc-50/70 dark:bg-[#181515]/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl space-x-2 px-4 sm:px-6 lg:px-8">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "text-[#E50914] dark:text-white"
                      : "text-zinc-600 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-[#F5F5F1]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#E50914]" : "text-zinc-400 dark:text-zinc-500"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-[#E50914] to-[#B81D24] shadow-sm shadow-red-500/50" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#1A1717] border-r border-zinc-200 dark:border-white/10 p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E50914]">
                    <Droplet className="h-4 w-4 fill-white text-white" />
                  </div>
                  <span className="text-lg font-bold text-zinc-900 dark:text-[#F5F5F1]">RAKTKOSH</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-500 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-white"
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
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-[#E50914] text-white shadow-lg shadow-red-900/30"
                          : "text-zinc-700 dark:text-[#9E9A97] hover:bg-zinc-100 dark:hover:bg-[#221F1F] hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs text-zinc-500 dark:text-[#9E9A97]">
              <span>Raktkosh Bio-Vault v1.0</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-amber-400"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
