import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let styleClasses =
    "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60";

  const lower = status.toLowerCase();

  if (
    lower === "active" ||
    lower === "available" ||
    lower === "completed" ||
    lower === "fulfilled" ||
    lower === "approved"
  ) {
    styleClasses =
      "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30";
  } else if (
    lower === "pending" ||
    lower === "under screening" ||
    lower === "partially fulfilled" ||
    lower === "medium" ||
    lower === "urgent"
  ) {
    styleClasses =
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30";
  } else if (
    lower === "critical" ||
    lower === "expired" ||
    lower === "discarded" ||
    lower === "rejected"
  ) {
    styleClasses =
      "bg-red-50 text-[#E50914] border-red-300 dark:bg-[#E50914]/15 dark:text-[#E50914] dark:border-[#E50914]/40 font-semibold";
  } else if (
    lower === "inactive" ||
    lower === "deferred" ||
    lower === "reserved" ||
    lower === "cancelled" ||
    lower === "normal"
  ) {
    styleClasses =
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/50";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClasses} shadow-sm transition-colors`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
}
