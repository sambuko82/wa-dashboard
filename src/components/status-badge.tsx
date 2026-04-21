"use client";

import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/wa-client";

interface StatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<
  ConnectionStatus,
  { label: string; dot: string; badge: string }
> = {
  connected: {
    label: "Connected",
    dot: "bg-[#546dfe]",
    badge: "border-[#cfd7ff] bg-[#eef1ff] text-[#4358d8]",
  },
  connecting: {
    label: "Connecting",
    dot: "bg-yellow-500 animate-pulse",
    badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-600",
  },
};

export function StatusBadge({
  status,
  className,
  showLabel = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        config.badge,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full flex-shrink-0", config.dot)} />
      {showLabel && (
        <span>{config.label}</span>
      )}
    </div>
  );
}
