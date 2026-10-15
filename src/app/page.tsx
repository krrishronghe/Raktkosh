"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Droplet,
  Users,
  GitPullRequest,
  HeartHandshake,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Building,
  Calendar,
  Sparkles,
  Activity,
  Thermometer,
  ShieldCheck,
  Zap,
} from "lucide-react";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import StatusBadge from "@/components/StatusBadge";

interface DashboardData {
  metrics: {
    totalDonors: number;
    activeDonors: number;
    totalAvailableUnits: number;
    totalDonationRecords: number;
    pendingRequestsCount: number;
    criticalRequestsCount: number;
    fulfilledRequestsCount: number;
    expiringUnitsSoon: number;
  };
  stockDistribution: Record<string, number>;
  recentDonations: Array<{
    _id: string;
    donationId: string;
    donorName: string;
    bloodGroup: string;
    unitsDonated: number;
    collectionCenter: string;
    donationDate: string;
    status: string;
  }>;
  recentRequests: Array<{
    _id: string;
    requestId: string;
    patientOrHospitalName: string;
    bloodGroup: string;
    unitsRequested: number;
    urgency: string;
    status: string;
    requiredByDate: string;
  }>;
  generatedAt: string;
}

const BLOOD_COMPATIBILITY: Record<string, { role: string; type: "donor" | "recipient" | "standard" }> = {
  "O-": { role: "Universal Donor", type: "donor" },
  "O+": { role: "Emergency Reserve", type: "standard" },
  "A+": { role: "Common Group", type: "standard" },
  "A-": { role: "Rare Negative", type: "standard" },
  "B+": { role: "High Demand", type: "standard" },
  "B-": { role: "Rare Negative", type: "standard" },
  "AB+": { role: "Universal Recipient", type: "recipient" },
  "AB-": { role: "Ultra Rare (0.6%)", type: "standard" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = () => {
    setLoading(true);
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to load dashboard metrics.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Unable to connect to Raktkosh database service.");
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => res.json())
      .then((result) => {
        if (!isMounted) return;
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to load dashboard metrics.");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError("Unable to connect to Raktkosh database service.");
        console.error(err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = () => {
    fetchMetrics();
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <div className="relative inline-flex items-center justify-center p-6 rounded-3xl glass-panel-glow mb-6 animate-cardiac">
          <Droplet className="h-10 w-10 text-[#E50914] animate-bounce" />
          <span className="absolute inset-0 rounded-3xl border border-[#E50914]/40 animate-ping opacity-25" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-[#F5F5F1]">
          Initializing Raktkosh Bio-Telemetry...
        </h2>
        <p className="text-sm text-zinc-500 dark:text-[#9E9A97] mt-1.5">
          Connecting to MongoDB 8.3 & aggregating cold storage vault metrics
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-8 text-center glass-panel">
          <AlertTriangle className="mx-auto h-12 w-12 text-[#E50914] mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-[#F5F5F1]">Database Connection Alert</h2>
          <p className="text-sm text-zinc-600 dark:text-[#9E9A97] mt-1.5 mb-6">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-sm font-semibold shadow-lg shadow-red-900/40 transition-all hover:scale-105"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reconnect to MongoDB</span>
          </button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const stock = data?.stockDistribution || {};
  const isDatabaseEmpty =
    metrics &&
    metrics.totalDonors === 0 &&
    metrics.totalAvailableUnits === 0 &&
    metrics.pendingRequestsCount === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-8">
      {/* 3D Bio-Vault Hero Command Bar */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-8 overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10">
        {/* Ambient Radial Backlight Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-red-600/10 dark:bg-red-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-red-900/10 dark:bg-red-900/25 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-bold text-[#E50914] uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-[#E50914] animate-ping" />
                <span>Central Bio-Vault Command</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                <span>Database Sync Active</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-[#F5F5F1]">
              Live Blood Bank <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E50914] via-[#B81D24] to-red-400">Telemetry</span>
            </h1>
            <p className="text-sm text-zinc-600 dark:text-[#9E9A97] max-w-2xl leading-relaxed">
              Real-time monitoring of blood reserves, hospital requisition lifecycles, voluntary donors, and cold vault preservation parameters.
            </p>
          </div>

          {/* Real-time ECG Wave Monitor & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* ECG Simulator Canvas Graphic */}
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/10 flex items-center space-x-3 shadow-inner">
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-zinc-500 dark:text-[#9E9A97]">
                  <Activity className="h-3.5 w-3.5 text-[#E50914]" />
                  <span>Bio-Vitals</span>
                </div>
                <span className="text-lg font-black font-mono text-zinc-900 dark:text-[#F5F5F1]">
                  72 <span className="text-xs font-normal text-zinc-500">BPM</span>
                </span>
              </div>
              <div className="w-24 h-10 overflow-hidden relative">
                <svg
                  className="w-full h-full text-[#E50914]"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path
                    d="M0 20 L20 20 L25 5 L30 35 L35 15 L40 22 L45 20 L100 20"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-ecg"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#221F1F] hover:bg-zinc-200 dark:hover:bg-[#2B2626] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-[#F5F5F1] transition-all hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 text-[#E50914] ${loading ? "animate-spin" : ""}`} />
                <span>Sync Live</span>
              </button>

              <Link
                href="/requests"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B81D24] text-xs font-bold text-white shadow-lg shadow-red-900/40 hover:shadow-red-900/60 transition-all hover:scale-105"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Issue Requisition</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Telemetry Micro-Pills (Inspired by Image 2 Anatomical Reference) */}
        <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-zinc-600 dark:text-[#9E9A97]">
            <Thermometer className="h-4 w-4 text-cyan-400" />
            <span>Vault Temp: <strong className="text-zinc-900 dark:text-[#F5F5F1] font-mono">4.2°C</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-zinc-600 dark:text-[#9E9A97]">
            <Droplet className="h-4 w-4 text-[#E50914]" />
            <span>Volume/Unit: <strong className="text-zinc-900 dark:text-[#F5F5F1] font-mono">450 mL</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-zinc-600 dark:text-[#9E9A97]">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Stability: <strong className="text-zinc-900 dark:text-[#F5F5F1] font-mono">99.8%</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-zinc-600 dark:text-[#9E9A97]">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Database: <strong className="text-zinc-900 dark:text-[#F5F5F1] font-mono">MongoDB NoSQL</strong></span>
          </div>
        </div>
      </div>

      {/* Empty Database Callout if applicable */}
      {isDatabaseEmpty && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F5F5F1]">The database is currently clear</h3>
              <p className="text-xs text-zinc-600 dark:text-[#9E9A97] mt-0.5">
                No donor records or blood inventory currently exist. You can populate verified test records with 1 click:
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              await fetch("/api/seed", { method: "POST" });
              fetchMetrics();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-bold text-white shadow-lg shadow-red-900/40"
          >
            Populate Demo Records
          </button>
        </div>
      )}

      {/* 4 Primary 3D Metric Pods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Blood Units */}
        <Link
          href="/inventory"
          className="group relative rounded-3xl glass-card-interactive p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9E9A97]">
              Total Blood Stock
            </span>
            <div className="p-2.5 rounded-2xl bg-red-500/10 dark:bg-[#E50914]/15 border border-red-500/20 dark:border-[#E50914]/30 text-[#E50914] group-hover:scale-110 transition-transform">
              <Droplet className="h-5 w-5 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
              {metrics?.totalAvailableUnits ?? 0}
            </span>
            <span className="text-xs text-zinc-500 dark:text-[#9E9A97] font-semibold">Units in Vault</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-zinc-200 dark:border-white/5">
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">Transfusion Ready</span>
            <span className="text-zinc-500 dark:text-[#9E9A97] group-hover:text-[#E50914] transition-colors flex items-center font-semibold">
              View Inventory <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>

        {/* Card 2: Registered Donors */}
        <Link
          href="/donors"
          className="group relative rounded-3xl glass-card-interactive p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9E9A97]">
              Active Donor Network
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
              {metrics?.totalDonors ?? 0}
            </span>
            <span className="text-xs text-zinc-500 dark:text-[#9E9A97] font-semibold">
              ({metrics?.activeDonors ?? 0} Active)
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-zinc-200 dark:border-white/5">
            <span className="text-zinc-600 dark:text-[#9E9A97] font-medium">Verified Donors</span>
            <span className="text-zinc-500 dark:text-[#9E9A97] group-hover:text-blue-500 transition-colors flex items-center font-semibold">
              Manage Donors <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>

        {/* Card 3: Pending Blood Requests */}
        <Link
          href="/requests"
          className="group relative rounded-3xl glass-card-interactive p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9E9A97]">
              Hospital Requisitions
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform">
              <GitPullRequest className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
              {metrics?.pendingRequestsCount ?? 0}
            </span>
            {metrics?.criticalRequestsCount ? (
              <span className="text-[11px] font-bold text-[#E50914] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30">
                {metrics.criticalRequestsCount} Critical
              </span>
            ) : (
              <span className="text-xs text-zinc-500 dark:text-[#9E9A97]">Pending Order</span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-zinc-200 dark:border-white/5">
            <span className="text-zinc-600 dark:text-[#9E9A97] font-medium">Hospital Demand</span>
            <span className="text-zinc-500 dark:text-[#9E9A97] group-hover:text-amber-500 transition-colors flex items-center font-semibold">
              Review Queue <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>

        {/* Card 4: Fulfilled Requests & Donation Logs */}
        <Link
          href="/donations"
          className="group relative rounded-3xl glass-card-interactive p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9E9A97]">
              Sessions & Dispatches
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
              {metrics?.totalDonationRecords ?? 0}
            </span>
            <span className="text-xs text-zinc-500 dark:text-[#9E9A97] font-semibold">Collections</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-zinc-200 dark:border-white/5">
            <span className="text-emerald-500 font-bold">{metrics?.fulfilledRequestsCount ?? 0} Dispatched</span>
            <span className="text-zinc-500 dark:text-[#9E9A97] group-hover:text-emerald-500 transition-colors flex items-center font-semibold">
              Audit Log <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>
      </div>

      {/* 3D Blood Reserve Canisters (The 8 Blood Groups Matrix) */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-zinc-200 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Droplet className="h-4 w-4 text-[#E50914]" />
              <h2 className="text-xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
                Bio-Vial Inventory Reserve Matrix
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#9E9A97] mt-0.5">
              Live cryogenic cold vault capacity across all standard erythrocyte groups.
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-bold text-[#E50914] hover:underline flex items-center self-start sm:self-center"
          >
            Manage Detailed Batches <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => {
            const units = stock[bg] || 0;
            const compat = BLOOD_COMPATIBILITY[bg] || { role: "Standard", type: "standard" };
            const isLow = units < 5;
            const isCritical = units === 0;
            const fillPercentage = Math.min(100, Math.round((units / 20) * 100));

            return (
              <div
                key={bg}
                className="group relative rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200/90 dark:border-white/5 p-4 flex flex-col items-center justify-between text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#E50914]/40 hover:shadow-lg hover:shadow-red-900/10"
              >
                {/* 3D Glass Vial Cylinder Graphic */}
                <div className="relative w-14 h-24 rounded-full border-2 border-zinc-300 dark:border-white/20 bg-zinc-200/50 dark:bg-zinc-900/60 overflow-hidden shadow-inner my-2">
                  {/* Fluid Fill Level */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ${
                      isCritical
                        ? "bg-zinc-400"
                        : isLow
                        ? "bg-gradient-to-t from-amber-600 to-amber-400"
                        : "bg-gradient-to-t from-[#7A0A10] via-[#B81D24] to-[#E50914]"
                    }`}
                    style={{ height: `${Math.max(6, fillPercentage)}%` }}
                  >
                    {/* Fluid Surface Wave */}
                    <div className="w-full h-1.5 bg-white/30 animate-wave" />
                  </div>

                  {/* Glass Reflection Highlight on Vial Tube */}
                  <div className="absolute inset-y-0 left-1 w-1.5 bg-gradient-to-r from-white/40 to-transparent rounded-full pointer-events-none" />
                </div>

                <div className="mt-1">
                  <BloodGroupBadge bloodGroup={bg} size="md" />
                </div>

                <div className="mt-2">
                  <span className="text-2xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight font-mono">
                    {units}
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Units
                  </span>
                </div>

                <div className="w-full mt-2 pt-2 border-t border-zinc-200 dark:border-white/5">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider block truncate ${
                      compat.type === "donor"
                        ? "text-emerald-500"
                        : compat.type === "recipient"
                        ? "text-blue-500"
                        : "text-zinc-400"
                    }`}
                    title={compat.role}
                  >
                    {compat.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Live Hospital Queue & Donation Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hospital Requisitions Queue */}
        <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-zinc-200 dark:border-white/10 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-[#E50914]">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-[#F5F5F1]">
                    Urgent Hospital Requisitions
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-[#9E9A97]">Active patient triage</span>
                </div>
              </div>
              <Link
                href="/requests"
                className="text-xs font-semibold text-zinc-500 dark:text-[#9E9A97] hover:text-[#E50914] flex items-center"
              >
                View all ({metrics?.pendingRequestsCount ?? 0}) <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {(!data?.recentRequests || data.recentRequests.length === 0) ? (
              <div className="py-12 text-center text-xs text-zinc-500 dark:text-[#9E9A97]">
                No active hospital requests found in MongoDB.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/5 hover:border-red-500/30 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-3.5">
                      <BloodGroupBadge bloodGroup={req.bloodGroup} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1]">
                          {req.patientOrHospitalName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-[#9E9A97] mt-0.5">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {req.unitsRequested} unit(s)
                          </span>
                          <span>•</span>
                          <span className="font-mono">{req.requestId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <StatusBadge status={req.status} />
                      <StatusBadge status={req.urgency} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-white/5">
            <Link
              href="/requests"
              className="w-full inline-flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-zinc-800 dark:text-[#F5F5F1] transition-colors"
            >
              <span>Access Requisition Terminal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Donation Activity Sessions */}
        <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-zinc-200 dark:border-white/10 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-[#F5F5F1]">
                    Recent Donor Sessions
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-[#9E9A97]">Collection center intake</span>
                </div>
              </div>
              <Link
                href="/donations"
                className="text-xs font-semibold text-zinc-500 dark:text-[#9E9A97] hover:text-emerald-500 flex items-center"
              >
                View all ({metrics?.totalDonationRecords ?? 0}) <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {(!data?.recentDonations || data.recentDonations.length === 0) ? (
              <div className="py-12 text-center text-xs text-zinc-500 dark:text-[#9E9A97]">
                No recorded donations found in MongoDB.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentDonations.map((don) => (
                  <div
                    key={don._id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/5 hover:border-emerald-500/30 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-3.5">
                      <BloodGroupBadge bloodGroup={don.bloodGroup} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1]">
                          {don.donorName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-[#9E9A97] mt-0.5">
                          <span>{don.collectionCenter}</span>
                          <span>•</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{don.unitsDonated} unit</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-zinc-500 dark:text-[#9E9A97]">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(don.donationDate).toLocaleDateString()}</span>
                      </div>
                      <StatusBadge status={don.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-white/5">
            <Link
              href="/donations"
              className="w-full inline-flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-zinc-800 dark:text-[#F5F5F1] transition-colors"
            >
              <span>Record New Donor Session</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
