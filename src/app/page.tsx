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
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[#221F1F] border border-white/10 mb-4 animate-pulse">
          <Droplet className="h-8 w-8 text-[#E50914] animate-bounce" />
        </div>
        <h2 className="text-xl font-medium text-[#F5F5F1]">Connecting to MongoDB...</h2>
        <p className="text-sm text-[#9E9A97] mt-1">Aggregating real-time blood stock and donor records</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-[#E50914] mb-3" />
          <h2 className="text-lg font-bold text-[#F5F5F1]">Database Connection Issue</h2>
          <p className="text-sm text-[#9E9A97] mt-1 mb-4">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
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
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#E50914] mb-1">
            <span className="h-2 w-2 rounded-full bg-[#E50914]" />
            <span>Operations Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F1] sm:text-4xl">
            Live Blood Bank Overview
          </h1>
          <p className="text-sm text-[#9E9A97] mt-1 max-w-2xl">
            Centralized inventory tracking, real-time blood group availability, donor statistics, and emergency hospital requisitions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#221F1F] hover:bg-[#2B2626] border border-white/10 text-xs font-medium text-[#F5F5F1] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#E50914] ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live</span>
          </button>

          <Link
            href="/requests"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition-all hover:scale-105"
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            <span>Manage Requests</span>
          </Link>
        </div>
      </div>

      {/* Empty Database Notice if applicable */}
      {isDatabaseEmpty && (
        <div className="rounded-2xl border border-white/10 bg-[#221F1F]/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F5F5F1]">The database is currently empty</h3>
              <p className="text-xs text-[#9E9A97] mt-0.5">
                No donors or stock units have been added yet. You can register donors manually or click the button to populate realistic demonstration data.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              await fetch("/api/seed", { method: "POST" });
              fetchMetrics();
            }}
            className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-semibold text-white shrink-0 shadow-lg shadow-red-900/30"
          >
            Populate Demo Data
          </button>
        </div>
      )}

      {/* 4 Main Stat Cards (Inspired by Medical Dashboard Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Blood Units */}
        <Link
          href="/inventory"
          className="group relative rounded-2xl bg-[#221F1F]/80 border border-white/10 p-5 hover:border-[#E50914]/40 hover:bg-[#262222] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9E9A97] uppercase tracking-wider">
              Total Blood Stock
            </span>
            <div className="p-2 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914]">
              <Droplet className="h-4 w-4 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#F5F5F1] tracking-tight">
              {metrics?.totalAvailableUnits ?? 0}
            </span>
            <span className="text-xs text-[#9E9A97]">Units in Cold Vaults</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-emerald-400 font-medium">Ready for Transfusion</span>
            <span className="text-[#9E9A97] group-hover:text-white transition-colors flex items-center">
              Inventory <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>

        {/* Card 2: Registered Donors */}
        <Link
          href="/donors"
          className="group relative rounded-2xl bg-[#221F1F]/80 border border-white/10 p-5 hover:border-[#E50914]/40 hover:bg-[#262222] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9E9A97] uppercase tracking-wider">
              Registered Donors
            </span>
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#F5F5F1] tracking-tight">
              {metrics?.totalDonors ?? 0}
            </span>
            <span className="text-xs text-[#9E9A97]">
              ({metrics?.activeDonors ?? 0} Active)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#9E9A97]">Audited records</span>
            <span className="text-[#9E9A97] group-hover:text-white transition-colors flex items-center">
              Donors <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>

        {/* Card 3: Pending Blood Requests */}
        <Link
          href="/requests"
          className="group relative rounded-2xl bg-[#221F1F]/80 border border-white/10 p-5 hover:border-[#E50914]/40 hover:bg-[#262222] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9E9A97] uppercase tracking-wider">
              Pending Requisitions
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <GitPullRequest className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#F5F5F1] tracking-tight">
              {metrics?.pendingRequestsCount ?? 0}
            </span>
            {metrics?.criticalRequestsCount ? (
              <span className="text-xs font-semibold text-[#E50914] px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30">
                {metrics.criticalRequestsCount} Critical
              </span>
            ) : (
              <span className="text-xs text-[#9E9A97]">In queue</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#9E9A97]">Hospital orders</span>
            <span className="text-[#9E9A97] group-hover:text-white transition-colors flex items-center">
              Review <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>

        {/* Card 4: Fulfilled Requests & Donation Logs */}
        <Link
          href="/donations"
          className="group relative rounded-2xl bg-[#221F1F]/80 border border-white/10 p-5 hover:border-[#E50914]/40 hover:bg-[#262222] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#9E9A97] uppercase tracking-wider">
              Total Donations Logged
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <HeartHandshake className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#F5F5F1] tracking-tight">
              {metrics?.totalDonationRecords ?? 0}
            </span>
            <span className="text-xs text-[#9E9A97]">Sessions Completed</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-emerald-400">{metrics?.fulfilledRequestsCount ?? 0} Requisitions Fulfilled</span>
            <span className="text-[#9E9A97] group-hover:text-white transition-colors flex items-center">
              History <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </Link>
      </div>

      {/* Blood Group Availability Matrix (Clinical View) */}
      <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F1] tracking-tight">
              Blood Stock Distribution by Group
            </h2>
            <p className="text-xs text-[#9E9A97]">
              Current verified units in temperature-controlled cold vault storage.
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-medium text-[#E50914] hover:underline flex items-center"
          >
            Manage Detailed Batches <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => {
            const units = stock[bg] || 0;
            const isLow = units < 5;
            const isCritical = units === 0;

            return (
              <div
                key={bg}
                className="relative rounded-xl bg-[#1A1717] border border-white/5 p-4 flex flex-col items-center justify-center text-center hover:border-red-500/30 transition-colors"
              >
                <div className="mb-2">
                  <BloodGroupBadge bloodGroup={bg} size="lg" />
                </div>
                <span className="text-2xl font-black text-[#F5F5F1] tracking-tight">
                  {units}
                </span>
                <span className="text-[11px] text-[#9E9A97] uppercase tracking-wider">
                  Units
                </span>

                <div className="w-full mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? "bg-red-600 w-0"
                        : isLow
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (units / 20) * 100)}%` }}
                  />
                </div>

                <span
                  className={`mt-2 text-[10px] font-medium ${
                    isCritical
                      ? "text-red-400"
                      : isLow
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {isCritical ? "Depleted" : isLow ? "Low Stock" : "Adequate"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Requisitions & Recent Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Hospital Requests Queue */}
        <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-[#E50914]" />
                <h3 className="text-base font-bold text-[#F5F5F1]">
                  Urgent & Recent Requisitions
                </h3>
              </div>
              <Link
                href="/requests"
                className="text-xs text-[#9E9A97] hover:text-[#F5F5F1] flex items-center"
              >
                View all ({metrics?.pendingRequestsCount ?? 0}) <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {(!data?.recentRequests || data.recentRequests.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#9E9A97]">
                No active hospital requests found in MongoDB.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-3.5 rounded-xl bg-[#1A1717] border border-white/5 hover:border-white/15 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BloodGroupBadge bloodGroup={req.bloodGroup} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-[#F5F5F1]">
                          {req.patientOrHospitalName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-[#9E9A97] mt-0.5">
                          <span>{req.unitsRequested} unit(s) requested</span>
                          <span>•</span>
                          <span>ID: {req.requestId}</span>
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

          <div className="pt-4 mt-4 border-t border-white/5">
            <Link
              href="/requests"
              className="w-full inline-flex justify-center items-center space-x-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#F5F5F1] transition-colors"
            >
              <span>Go to Request Management</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Column 2: Recent Donation Records */}
        <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="h-4 w-4 text-[#E50914]" />
                <h3 className="text-base font-bold text-[#F5F5F1]">
                  Recent Donation Activity
                </h3>
              </div>
              <Link
                href="/donations"
                className="text-xs text-[#9E9A97] hover:text-[#F5F5F1] flex items-center"
              >
                View all ({metrics?.totalDonationRecords ?? 0}) <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {(!data?.recentDonations || data.recentDonations.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#9E9A97]">
                No recorded donations found in MongoDB.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentDonations.map((don) => (
                  <div
                    key={don._id}
                    className="p-3.5 rounded-xl bg-[#1A1717] border border-white/5 hover:border-white/15 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BloodGroupBadge bloodGroup={don.bloodGroup} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-[#F5F5F1]">
                          {don.donorName}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-[#9E9A97] mt-0.5">
                          <span>{don.collectionCenter}</span>
                          <span>•</span>
                          <span>{don.unitsDonated} unit</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-[#9E9A97]">
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

          <div className="pt-4 mt-4 border-t border-white/5">
            <Link
              href="/donations"
              className="w-full inline-flex justify-center items-center space-x-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#F5F5F1] transition-colors"
            >
              <span>Record New Blood Donation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
