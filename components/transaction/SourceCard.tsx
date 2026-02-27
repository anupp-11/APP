"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, getProgressColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { TransactionSource, ChimeAccount } from "@/lib/types";
import { calculateLimitPercentage, isNearLimit, isCriticalLimit } from "@/lib/mock-data";
import { AlertTriangle, Wallet, CreditCard } from "lucide-react";

interface SourceCardProps {
  source: TransactionSource;
  isSelected: boolean;
  onSelect: () => void;
}

function ProgressBar({ current, limit, label }: { current: number; limit: number; label: string }) {
  const percentage = calculateLimitPercentage(current, limit);
  const isWarning = isNearLimit(current, limit);
  const isCritical = isCriticalLimit(current, limit);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted">{label}</span>
        <span className={cn(
          "font-medium",
          isCritical ? "text-withdraw" : isWarning ? "text-warning" : "text-text-secondary"
        )}>
          {formatCurrency(current)} / {formatCurrency(limit)}
        </span>
      </div>
      <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getProgressColor(percentage)
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function SourceCard({ source, isSelected, onSelect }: SourceCardProps) {
  const isChime = source.sourceType === "chime";
  const chimeAccount = isChime ? (source as ChimeAccount & { sourceType: "chime" }) : null;
  const isInactive = source.status === "inactive";
  
  // Calculate warning states for Chime accounts
  const showInWarning = chimeAccount && isNearLimit(chimeAccount.current_month_in, chimeAccount.monthly_in_limit);
  const showOutWarning = chimeAccount && isNearLimit(chimeAccount.current_month_out, chimeAccount.monthly_out_limit);
  const hasWarning = showInWarning || showOutWarning;
  
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isInactive}
      className={cn(
        "relative w-full text-left p-4 rounded-lg border transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-holding focus:ring-offset-2 focus:ring-offset-bg-primary",
        isInactive && "opacity-50 cursor-not-allowed",
        isSelected && "border-2 border-holding bg-holding-bg",
        !isSelected && !isInactive && "border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-border-focus",
        hasWarning && !isSelected && "border-l-4 border-l-warning"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isChime ? (
            <Wallet className="w-4 h-4 text-text-muted" />
          ) : (
            <CreditCard className="w-4 h-4 text-platform" />
          )}
          <span className="font-semibold text-sm text-text-primary truncate">
            {source.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {hasWarning && (
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          )}
          {isChime && chimeAccount && (
            <Badge variant={chimeAccount.type === "holding" ? "holding" : "paying"}>
              {chimeAccount.type}
            </Badge>
          )}
          {!isChime && (
            <Badge variant="platform">Platform</Badge>
          )}
        </div>
      </div>
      
      {/* Chime Account Details */}
      {chimeAccount && (
        <div className="space-y-2 mb-3">
          <ProgressBar
            label="IN"
            current={chimeAccount.current_month_in}
            limit={chimeAccount.monthly_in_limit}
          />
          <ProgressBar
            label="OUT"
            current={chimeAccount.current_month_out}
            limit={chimeAccount.monthly_out_limit}
          />
        </div>
      )}
      
      {/* Platform Description */}
      {!isChime && source.sourceType === "platform" && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2">
          {source.description || "Payment platform"}
        </p>
      )}
      
      {/* Footer Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isInactive ? "bg-inactive" : "bg-deposit"
            )}
          />
          <span className="text-xs text-text-muted">
            {isInactive ? "Inactive" : "Active"}
          </span>
        </div>
        
        {chimeAccount?.atm_withdrawal_allowed && (
          <span className="text-xs text-text-muted">ATM: ✓</span>
        )}
      </div>
    </button>
  );
}
