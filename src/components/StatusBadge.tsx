import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "urgency";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let styleClasses = "bg-zinc-800/60 text-zinc-300 border-zinc-700/60";

  const lower = status.toLowerCase();

  if (
    lower === "active" ||
    lower === "available" ||
    lower === "completed" ||
    lower === "fulfilled" ||
    lower === "approved"
  ) {
    styleClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  } else if (
    lower === "pending" ||
    lower === "under screening" ||
    lower === "partially fulfilled" ||
    lower === "medium" ||
    lower === "urgent"
  ) {
    styleClasses = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  } else if (
    lower === "critical" ||
    lower === "expired" ||
    lower === "discarded" ||
    lower === "rejected"
  ) {
    styleClasses = "bg-[#E50914]/15 text-[#E50914] border-[#E50914]/40 font-semibold";
  } else if (
    lower === "inactive" ||
    lower === "deferred" ||
    lower === "reserved" ||
    lower === "cancelled" ||
    lower === "normal"
  ) {
    styleClasses = "bg-zinc-800/80 text-zinc-400 border-zinc-700/50";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
}
