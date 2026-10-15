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
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-bold",
    lg: "px-3.5 py-1.5 text-sm font-black",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md bg-[#E50914]/15 border border-[#E50914]/40 text-[#E50914] font-mono tracking-wider ${sizeClasses[size]}`}
    >
      {bloodGroup}
    </span>
  );
}
