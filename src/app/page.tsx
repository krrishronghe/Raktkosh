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
  Printer,
  Database,
  Clock,
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

const COMPATIBILITY_RULES: Record<
  string,
  {
    givesTo: string[];
    receivesFrom: string[];
    role: string;
    antigens: string;
    antibodies: string;
    clinicalNote: string;
  }
> = {
  "O-": {
    givesTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receivesFrom: ["O-"],
    role: "Universal Red Cell Donor",
    antigens: "None (Rh Negative)",
    antibodies: "Anti-A, Anti-B",
    clinicalNote: "Crucial emergency transfusion buffer. Can be safely administered to any patient before blood grouping is known.",
  },
  "O+": {
    givesTo: ["O+", "A+", "B+", "AB+"],
    receivesFrom: ["O+", "O-"],
    role: "Primary Hospital Reserve",
    antigens: "Rh(D)",
    antibodies: "Anti-A, Anti-B",
    clinicalNote: "Most transfused blood type across trauma centers. Required in high volumes for emergency surgeries.",
  },
  "A-": {
    givesTo: ["A-", "A+", "AB-", "AB+"],
    receivesFrom: ["A-", "O-"],
    role: "Rare Negative Group",
    antigens: "A Antigen",
    antibodies: "Anti-B",
    clinicalNote: "Compatible with all A and AB recipients. High priority for scheduled neonatal and cardiovascular procedures.",
  },
  "A+": {
    givesTo: ["A+", "AB+"],
    receivesFrom: ["A+", "A-", "O+", "O-"],
    role: "Inpatient High Demand",
    antigens: "A, Rh(D)",
    antibodies: "Anti-B",
    clinicalNote: "Second most prevalent group worldwide. Extensively utilized in surgical and oncology wards.",
  },
  "B-": {
    givesTo: ["B-", "B+", "AB-", "AB+"],
    receivesFrom: ["B-", "O-"],
    role: "Critical Scarcity Reserve",
    antigens: "B Antigen",
    antibodies: "Anti-A",
    clinicalNote: "Depleted in local cold storage. Target voluntary recruitment recommended immediately.",
  },
  "B+": {
    givesTo: ["B+", "AB+"],
    receivesFrom: ["B+", "B-", "O+", "O-"],
    role: "Sub-Continental Prevalence",
    antigens: "B, Rh(D)",
    antibodies: "Anti-A",
    clinicalNote: "High frequency in regional demographics. Vital for thalassemia and dialysis patient maintenance.",
  },
  "AB-": {
    givesTo: ["AB-", "AB+"],
    receivesFrom: ["AB-", "A-", "B-", "O-"],
    role: "Universal Plasma Donor",
    antigens: "A, B",
    antibodies: "None",
    clinicalNote: "Rarest standard group (~0.6%). Plasma contains no antibodies and can be given to any patient without reaction.",
  },
  "AB+": {
    givesTo: ["AB+"],
    receivesFrom: ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
    role: "Universal Red Cell Recipient",
    antigens: "A, B, Rh(D)",
    antibodies: "None",
    clinicalNote: "Can safely accept red blood cells from any donor blood group in life-saving emergency situations.",
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatrixGroup, setSelectedMatrixGroup] = useState<string>("O-");

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

        {/* Telemetry Micro-Pills (High Contrast Clinical Telemetry) */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-[#9E9A97]">
            <Thermometer className="h-4 w-4 text-cyan-500" />
            <span>Vault Temp: <strong className="text-slate-900 dark:text-[#F5F5F1] font-mono">3.4°C (Normal)</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600 dark:text-[#9E9A97]">
            <Droplet className="h-4 w-4 text-[#E50914]" />
            <span>Volume/Unit: <strong className="text-slate-900 dark:text-[#F5F5F1] font-mono">450 mL ACD-A</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600 dark:text-[#9E9A97]">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span>Stability: <strong className="text-slate-900 dark:text-[#F5F5F1] font-mono">99.8% Cold-Chain</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600 dark:text-[#9E9A97]">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>ACID Engine: <strong className="text-slate-900 dark:text-[#F5F5F1] font-mono">MongoDB 8.3</strong></span>
          </div>
        </div>
      </div>

      {/* ================= CLINICAL COMMAND DOCK & RESERVE READINESS GAUGE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Transfusion Reserve Sufficiency & DEFCON Gauge */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-[#E50914]">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Transfusion Reserve Sufficiency Index
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#9E9A97]">
                    Algorithmic calculation based on cold vault reserves, emergency requisitions, and shelf-life buffer.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    (metrics?.criticalRequestsCount ?? 0) > 0
                      ? "bg-red-500/15 border-red-500/40 text-[#E50914] animate-pulse"
                      : (metrics?.totalAvailableUnits ?? 0) >= 50
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {(metrics?.criticalRequestsCount ?? 0) > 0
                    ? "DEFCON 3 • EMERGENCY SHORTAGE"
                    : (metrics?.totalAvailableUnits ?? 0) >= 50
                    ? "DEFCON 1 • OPTIMAL BUFFER"
                    : "DEFCON 2 • ELEVATED DEMAND"}
                </span>
              </div>
            </div>

            {/* Gauge Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span>Vault Stock Sufficiency</span>
                <span className="font-mono text-[#E50914]">
                  {Math.min(100, Math.round(((metrics?.totalAvailableUnits ?? 0) / 60) * 100))}% Capacity
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    (metrics?.criticalRequestsCount ?? 0) > 0
                      ? "bg-gradient-to-r from-red-600 to-amber-500"
                      : "bg-gradient-to-r from-[#B81D24] via-[#E50914] to-emerald-500"
                  }`}
                  style={{
                    width: `${Math.max(12, Math.min(100, Math.round(((metrics?.totalAvailableUnits ?? 0) / 60) * 100)))}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#9E9A97] mt-3 leading-relaxed">
              {(metrics?.criticalRequestsCount ?? 0) > 0
                ? "Immediate clinical attention required: Critical patient blood requests are pending crossmatch fulfillment."
                : "Active blood supply is within acceptable WHO clinical transfusion buffer thresholds. Cold vault temperature maintained."}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-[#E50914]" />
              <span>
                Expiring in 7 Days:{" "}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {metrics?.expiringUnitsSoon ?? 0} Unit(s)
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-semibold transition-colors"
              title="Print Clinical Summary Report"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-300" />
              <span>Print Shift Report</span>
            </button>
          </div>
        </div>

        {/* Clinical Quick Action Control Deck */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-white/10 mb-4">
              <Zap className="h-4 w-4 text-[#E50914]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Clinical Station Actions
              </h3>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/requests"
                className="flex items-center justify-between p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-slate-900 dark:text-white transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#E50914] text-white">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Issue Emergency Requisition</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9E9A97]">Patient blood allocation</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#E50914] group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/donors"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/5 text-slate-900 dark:text-white transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-blue-500 text-white">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Register Voluntary Donor</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9E9A97]">Add verified donor file</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/inventory"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/5 text-slate-900 dark:text-white transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500 text-white">
                    <Database className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Log Cold Vault Batch</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9E9A97]">Add inventory with expiry</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/donations"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/5 text-slate-900 dark:text-white transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <HeartHandshake className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Record Donation Session</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#9E9A97]">Collection center intake</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F1]">The database is currently clear</h3>
              <p className="text-xs text-slate-600 dark:text-[#9E9A97] mt-0.5">
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
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Droplet className="h-4 w-4 text-[#E50914]" />
              <h2 className="text-xl font-black text-slate-900 dark:text-[#F5F5F1] tracking-tight">
                Bio-Vial Cryogenic Inventory Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9E9A97] mt-0.5">
              Live cryogenic cold vault capacity across all standard erythrocyte groups. Click any vial to load diagnostic crossmatch rules.
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
            const isLow = units > 0 && units < 5;
            const isCritical = units === 0;
            const fillPercentage = Math.min(100, Math.round((units / 20) * 100));
            const isSelected = selectedMatrixGroup === bg;

            return (
              <button
                key={bg}
                type="button"
                onClick={() => {
                  setSelectedMatrixGroup(bg);
                  document.getElementById("crossmatch-diagnostic")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group relative rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-300 hover:-translate-y-1.5 focus:outline-none ${
                  isSelected
                    ? "bg-red-50 dark:bg-red-950/20 border-2 border-[#E50914] shadow-lg shadow-red-900/20 ring-2 ring-[#E50914]/30"
                    : "bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 hover:border-[#E50914]/50 shadow-sm hover:shadow-lg"
                }`}
                title={`Click to analyze ${bg} crossmatch rules`}
              >
                {/* Cryogenic Metallic Top Cap */}
                <div className="w-9 h-2 rounded-t-md bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 dark:from-zinc-600 dark:via-zinc-400 dark:to-zinc-700 border border-slate-400 dark:border-zinc-500 shadow-sm mx-auto" />

                {/* 3D Glass Vial Cylinder Graphic */}
                <div className="relative w-14 h-24 rounded-b-2xl border-2 border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-zinc-900/60 overflow-hidden shadow-inner my-1.5">
                  {/* Etched Laboratory Graduation Marks */}
                  <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-2 text-[7px] font-mono text-slate-400 dark:text-zinc-600 pointer-events-none z-10 select-none">
                    <span>—</span>
                    <span>—</span>
                    <span>—</span>
                  </div>

                  {/* Fluid Fill Level */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ${
                      isCritical
                        ? "bg-slate-300 dark:bg-zinc-700"
                        : isLow
                        ? "bg-gradient-to-t from-amber-600 to-amber-400"
                        : "bg-gradient-to-t from-[#7A0A10] via-[#B81D24] to-[#E50914]"
                    }`}
                    style={{ height: `${Math.max(6, fillPercentage)}%` }}
                  >
                    {/* Fluid Surface Wave */}
                    <div className="w-full h-1.5 bg-white/30 animate-wave" />
                  </div>

                  {/* Glass Specular Glint */}
                  <div className="absolute inset-y-0 left-1 w-1.5 bg-gradient-to-r from-white/45 to-transparent rounded-full pointer-events-none" />
                </div>

                <div className="mt-1">
                  <BloodGroupBadge bloodGroup={bg} size="md" />
                </div>

                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-[#F5F5F1] tracking-tight font-mono">
                    {units}
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">
                    Units
                  </span>
                </div>

                {/* Reserve Status Pill */}
                <div className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider block truncate ${
                      isCritical
                        ? "text-[#E50914] font-black"
                        : isLow
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isCritical ? "Depleted" : isLow ? "Low Buffer" : "Optimal"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= INTERACTIVE CLINICAL CROSS-MATCH & COMPATIBILITY MATRIX ================= */}
      <div id="crossmatch-diagnostic" className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-xl scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#E50914] mb-1">
              <Sparkles className="h-4 w-4" />
              <span>Clinical Diagnostic Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F1] tracking-tight">
              Interactive Transfusion & Cross-Match Matrix
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#9E9A97] mt-0.5">
              Select an erythrocyte group to view live biological cross-match compatibility pathways and current cold vault reserves.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#9E9A97] uppercase">Selected:</span>
            <BloodGroupBadge bloodGroup={selectedMatrixGroup} size="lg" />
          </div>
        </div>

        {/* 8 Blood Group Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {Object.keys(COMPATIBILITY_RULES).map((bg) => {
            const isSelected = selectedMatrixGroup === bg;
            const unitsInVault = stock[bg] || 0;
            return (
              <button
                key={bg}
                type="button"
                onClick={() => setSelectedMatrixGroup(bg)}
                className={`flex-1 min-w-[70px] sm:min-w-[90px] py-3 px-2.5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? "bg-[#E50914] border-[#E50914] text-white shadow-lg shadow-red-900/30 scale-105"
                    : "bg-white dark:bg-[#1A1717] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-zinc-200"
                }`}
              >
                <div className="text-sm font-black font-mono">{bg}</div>
                <div className="text-[10px] mt-0.5 font-bold opacity-80">{unitsInVault} Units</div>
              </button>
            );
          })}
        </div>

        {/* Dynamic 3-Column Compatibility Visualizer */}
        {(() => {
          const rule = COMPATIBILITY_RULES[selectedMatrixGroup] || COMPATIBILITY_RULES["O-"];
          const units = stock[selectedMatrixGroup] || 0;
          return (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Column 1: Can Donate Red Cells To */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F5F5F1] uppercase tracking-wider flex items-center">
                    <ArrowRight className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    Can Donate To
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {rule.givesTo.length} of 8 Groups
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((target) => {
                    const isCompatible = rule.givesTo.includes(target);
                    return (
                      <div
                        key={target}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold border transition-colors ${
                          isCompatible
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-zinc-600 line-through opacity-40"
                        }`}
                      >
                        {target}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#9E9A97] mt-3">
                  {selectedMatrixGroup === "O-"
                    ? "★ Universal Red Blood Cell Donor (safest for emergency transfusion without prior crossmatch)."
                    : `Compatible red blood cells can be infused safely into ${rule.givesTo.join(", ")} recipients.`}
                </p>
              </div>

              {/* Column 2: Can Receive Red Cells From */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F5F5F1] uppercase tracking-wider flex items-center">
                    <Droplet className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    Can Receive From
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {rule.receivesFrom.length} of 8 Groups
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((source) => {
                    const isCompatible = rule.receivesFrom.includes(source);
                    return (
                      <div
                        key={source}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold border transition-colors ${
                          isCompatible
                            ? "bg-blue-500/15 border-blue-500/50 text-blue-700 dark:text-blue-300"
                            : "bg-slate-100/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-zinc-600 line-through opacity-40"
                        }`}
                      >
                        {source}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#9E9A97] mt-3">
                  {selectedMatrixGroup === "AB+"
                    ? "★ Universal Red Cell Recipient (can safely receive blood from any of the 8 ABO/Rh types)."
                    : `In need of blood, patient can only receive units from: ${rule.receivesFrom.join(", ")}.`}
                </p>
              </div>

              {/* Column 3: Clinical Profile & Vault Stock Status */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-[#F5F5F1] uppercase tracking-wider">
                      Vault Stock & Clinical Vitals
                    </span>
                    <span className="text-xs font-black font-mono text-[#E50914]">
                      {units} Unit(s)
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-[#9E9A97]">Clinical Role:</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{rule.role}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-[#9E9A97]">Erythrocyte Antigens:</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-300">{rule.antigens}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-[#9E9A97]">Plasma Antibodies:</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-300">{rule.antibodies}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
                    {rule.clinicalNote}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <Link
                    href={`/inventory?bloodGroup=${encodeURIComponent(selectedMatrixGroup)}`}
                    className="text-xs font-bold text-[#E50914] hover:underline flex items-center"
                  >
                    View Batches in Vault <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                  <Link
                    href="/requests"
                    className="px-3 py-1 rounded-xl bg-[#E50914]/10 hover:bg-[#E50914] text-[#E50914] hover:text-white border border-[#E50914]/30 text-xs font-bold transition-all"
                  >
                    Issue Unit
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ================= ADBMS MONGODB 8.3 ARCHITECTURE & ACID ENGINE TELEMETRY ================= */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ADBMS Architecture Matrix
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  MongoDB 8.3
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Database Schema Design, Indexing & ACID Compliance
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 dark:text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Multi-Document ACID Guaranteed</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Collection 1: donors */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white">db.donors</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                {metrics?.totalDonors ?? 0} Docs
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Demographic records, contact indexing, blood group categorization, and donation eligibility lifecycle.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Index: <code className="text-slate-800 dark:text-zinc-300">donorId (unique)</code>
            </div>
          </div>

          {/* Collection 2: inventory */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white">db.inventory</span>
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-[#E50914] font-bold text-[10px]">
                {metrics?.totalAvailableUnits ?? 0} Units
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Cryogenic bio-vault stock tracking, batch numbers, storage racks, and 42-day shelf-life calculation.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Index: <code className="text-slate-800 dark:text-zinc-300">bloodGroup + status</code>
            </div>
          </div>

          {/* Collection 3: bloodrequests */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white">db.bloodrequests</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                {metrics?.pendingRequestsCount ?? 0} Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Hospital requisitions, urgency classification (Critical/Urgent/Normal), and atomic unit allocation.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Index: <code className="text-slate-800 dark:text-zinc-300">urgency + status</code>
            </div>
          </div>

          {/* Collection 4: donations */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white">db.donations</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                {metrics?.totalDonationRecords ?? 0} Sessions
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Session audit logs, foreign key linkage to donor records, and automatic stock batch generation.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Ref: <code className="text-slate-800 dark:text-zinc-300">donorId -&gt; Donor._id</code>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Hospital Queue & Donation Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hospital Requisitions Queue */}
        <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-[#E50914]">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F1]">
                    Urgent Hospital Requisitions
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-[#9E9A97]">Active patient triage</span>
                </div>
              </div>
              <Link
                href="/requests"
                className="text-xs font-semibold text-slate-600 dark:text-[#9E9A97] hover:text-[#E50914] flex items-center"
              >
                View all ({metrics?.pendingRequestsCount ?? 0}) <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {(!data?.recentRequests || data.recentRequests.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-[#9E9A97]">
                No active hospital requests found in MongoDB.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 hover:border-red-500/30 flex items-center justify-between transition-all shadow-sm"
                  >
                    <div className="flex items-center space-x-3.5">
                      <BloodGroupBadge bloodGroup={req.bloodGroup} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-[#F5F5F1]">
                          {req.patientOrHospitalName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-[#9E9A97] mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">
                            {req.unitsRequested} unit(s)
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 dark:text-zinc-400">{req.requestId}</span>
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

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/5">
            <Link
              href="/requests"
              className="w-full inline-flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-800 dark:text-[#F5F5F1] transition-colors"
            >
              <span>Access Requisition Terminal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Donation Activity Sessions */}
        <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F5F1]">
                    Recent Donor Sessions
                  </h3>
                  <span className="text-xs text-slate-600 dark:text-[#9E9A97]">Collection center intake</span>
                </div>
              </div>
              <Link
                href="/donations"
                className="text-xs font-semibold text-slate-600 dark:text-[#9E9A97] hover:text-emerald-500 flex items-center"
              >
                View all ({metrics?.totalDonationRecords ?? 0}) <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {(!data?.recentDonations || data.recentDonations.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-[#9E9A97]">
                No recorded donations found in MongoDB.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentDonations.map((don) => (
                  <div
                    key={don._id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#181415] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 flex items-center justify-between transition-all shadow-sm"
                  >
                    <div className="flex items-center space-x-3.5">
                      <BloodGroupBadge bloodGroup={don.bloodGroup} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-[#F5F5F1]">
                          {don.donorName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-[#9E9A97] mt-0.5">
                          <span>{don.collectionCenter}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">{don.unitsDonated} unit</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-[#9E9A97]">
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

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/5">
            <Link
              href="/donations"
              className="w-full inline-flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-800 dark:text-[#F5F5F1] transition-colors"
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
