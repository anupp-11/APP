"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types";

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}

export function TransactionTypeToggle({
  value,
  onChange,
}: TransactionTypeToggleProps) {
  return (
    <div className="relative flex w-full rounded-lg bg-bg-tertiary p-1 border border-border">
      {/* Sliding Background */}
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-200 ease-out",
          value === "deposit" ? "left-1 bg-deposit" : "left-[calc(50%+2px)] bg-withdraw"
        )}
      />
      
      {/* Deposit Button */}
      <button
        type="button"
        onClick={() => onChange("deposit")}
        className={cn(
          "relative z-10 flex-1 h-14 text-lg font-semibold rounded-md transition-colors duration-150",
          value === "deposit"
            ? "text-white"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        DEPOSIT
      </button>
      
      {/* Withdraw Button */}
      <button
        type="button"
        onClick={() => onChange("withdraw")}
        className={cn(
          "relative z-10 flex-1 h-14 text-lg font-semibold rounded-md transition-colors duration-150",
          value === "withdraw"
            ? "text-white"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        WITHDRAW
      </button>
    </div>
  );
}
