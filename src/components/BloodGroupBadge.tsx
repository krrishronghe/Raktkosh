import React from "react";

interface BloodGroupBadgeProps {
  bloodGroup: string;
  size?: "sm" | "md" | "lg";
}

export default function BloodGroupBadge({
  bloodGroup,
  size = "md",
}: BloodGroupBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-bold",
    md: "px-2.5 py-1 text-xs font-black",
    lg: "px-3.5 py-1.5 text-sm font-black tracking-wide",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-red-500/10 dark:bg-[#E50914]/15 border border-red-500/30 dark:border-[#E50914]/40 text-[#E50914] font-mono shadow-sm shadow-red-900/10 ${sizeClasses[size]}`}
    >
      {bloodGroup}
    </span>
  );
}
