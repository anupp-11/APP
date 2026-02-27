"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { QUICK_AMOUNTS, type QuickAmount } from "@/lib/types";

interface AmountQuickButtonsProps {
  selectedAmount: number;
  onSelect: (amount: QuickAmount) => void;
}

export function AmountQuickButtons({
  selectedAmount,
  onSelect,
}: AmountQuickButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {QUICK_AMOUNTS.map((amount) => {
        const isSelected = selectedAmount === amount;
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onSelect(amount)}
            className={cn(
              "h-11 min-w-16 px-3 text-base font-semibold rounded-md border transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-holding focus:ring-offset-2 focus:ring-offset-bg-primary",
              isSelected
                ? "bg-holding-bg border-holding border-2 text-holding"
                : "bg-bg-tertiary border-border text-text-primary hover:border-border-focus hover:bg-bg-secondary"
            )}
          >
            ${amount}
          </button>
        );
      })}
    </div>
  );
}
