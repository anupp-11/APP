"use client";

import * as React from "react";
import { useEffect, useCallback, useTransition } from "react";
import { TransactionTypeToggle } from "@/components/transaction/TransactionTypeToggle";
import { AmountQuickButtons } from "@/components/transaction/AmountQuickButtons";
import { NotesInput } from "@/components/transaction/NotesInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, getProgressColor } from "@/lib/utils";
import { submitTransactionAction } from "./actions";
import type {
  ChimeAccountStats,
  PlatformInfo,
  GameInfo,
  QuickTransactionPageData,
} from "./actions";
import type { TransactionType, QuickAmount, ValidationErrors } from "@/lib/types";
import { Wallet, CreditCard, AlertTriangle, Keyboard, Copy, Check } from "lucide-react";

// ============================================
// Progress Bar Component
// ============================================

function ProgressBar({
  current,
  limit,
  label,
  isNear,
  isCritical,
}: {
  current: number;
  limit: number;
  label: string;
  isNear: boolean;
  isCritical: boolean;
}) {
  const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted">{label}</span>
        <span
          className={cn(
            "font-medium",
            isCritical
              ? "text-withdraw"
              : isNear
              ? "text-warning"
              : "text-text-secondary"
          )}
        >
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

// ============================================
// Chime Account Card
// ============================================

function ChimeAccountCard({
  account,
  isSelected,
  onSelect,
  hasError,
  transactionType,
}: {
  account: ChimeAccountStats;
  isSelected: boolean;
  onSelect: () => void;
  hasError: boolean;
  transactionType: TransactionType;
}) {
  const [copied, setCopied] = React.useState(false);
  const isInactive = account.status === "inactive";
  const showInWarning = transactionType === "deposit" && account.isNearInLimit;
  const showOutWarning = transactionType === "withdraw" && account.isNearOutLimit;
  const hasWarning = showInWarning || showOutWarning;

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (account.tag) {
      navigator.clipboard.writeText(account.tag);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      onClick={isInactive ? undefined : onSelect}
      role="button"
      tabIndex={isInactive ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && !isInactive && onSelect()}
      className={cn(
        "relative w-full text-left p-4 rounded-lg border transition-all duration-150 cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-holding focus:ring-offset-2 focus:ring-offset-bg-primary",
        isInactive && "opacity-50 cursor-not-allowed",
        isSelected && "border-2 border-holding bg-holding-bg",
        !isSelected &&
          !isInactive &&
          "border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-border-focus",
        hasWarning && !isSelected && "border-l-4 border-l-warning",
        hasError && !isSelected && "ring-2 ring-withdraw ring-offset-1"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Wallet className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="font-semibold text-sm text-text-primary truncate">
            {account.nickname}
          </span>
          {account.tag && (
            <span
              onClick={handleCopyTag}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-text-muted hover:text-text-primary bg-bg-tertiary rounded transition-colors flex-shrink-0 cursor-pointer"
              title={`Copy: ${account.tag}`}
            >
              {copied ? <Check className="w-3 h-3 text-deposit" /> : <Copy className="w-3 h-3" />}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
          <Badge variant={account.type === "holding" ? "holding" : "paying"}>
            {account.type}
          </Badge>
        </div>
      </div>

      {/* Limits */}
      <div className="space-y-2">
        <ProgressBar
          label="IN"
          current={account.currentMonthIn}
          limit={account.monthlyInLimit}
          isNear={account.isNearInLimit}
          isCritical={account.isCriticalIn}
        />
        <ProgressBar
          label="OUT"
          current={account.currentMonthOut}
          limit={account.monthlyOutLimit}
          isNear={account.isNearOutLimit}
          isCritical={account.isCriticalOut}
        />
      </div>

      {/* ATM indicator */}
      {account.atmWithdrawalEnabled && (
        <div className="mt-2 text-xs text-text-muted">ATM enabled</div>
      )}
    </div>
  );
}

// ============================================
// Platform Card
// ============================================

function PlatformCard({
  platform,
  isSelected,
  onSelect,
  hasError,
}: {
  platform: PlatformInfo;
  isSelected: boolean;
  onSelect: () => void;
  hasError: boolean;
}) {
  const [copiedDeposit, setCopiedDeposit] = React.useState(false);
  const [copiedWithdraw, setCopiedWithdraw] = React.useState(false);
  const isInactive = platform.status === "inactive";

  const handleCopyDeposit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (platform.depositUrl) {
      navigator.clipboard.writeText(platform.depositUrl);
      setCopiedDeposit(true);
      setTimeout(() => setCopiedDeposit(false), 1500);
    }
  };

  const handleCopyWithdraw = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (platform.withdrawUrl) {
      navigator.clipboard.writeText(platform.withdrawUrl);
      setCopiedWithdraw(true);
      setTimeout(() => setCopiedWithdraw(false), 1500);
    }
  };

  return (
    <div
      onClick={isInactive ? undefined : onSelect}
      role="button"
      tabIndex={isInactive ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && !isInactive && onSelect()}
      className={cn(
        "relative w-full text-left p-4 rounded-lg border transition-all duration-150 cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-holding focus:ring-offset-2 focus:ring-offset-bg-primary",
        isInactive && "opacity-50 cursor-not-allowed",
        isSelected && "border-2 border-holding bg-holding-bg",
        !isSelected &&
          !isInactive &&
          "border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-border-focus",
        hasError && !isSelected && "ring-2 ring-withdraw ring-offset-1"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-platform" />
          <span className="font-semibold text-sm text-text-primary">
            {platform.name}
          </span>
        </div>
        <span className="font-mono text-sm text-text-secondary">
          {formatCurrency(platform.balance)}
        </span>
      </div>
      
      {/* Copy buttons for deposit/withdraw URLs */}
      <div className="flex gap-2">
        {platform.depositUrl && (
          <span
            onClick={handleCopyDeposit}
            className="flex items-center gap-1 px-2 py-1 text-xs text-deposit bg-deposit/10 hover:bg-deposit/20 rounded transition-colors cursor-pointer"
            title="Copy deposit URL"
          >
            {copiedDeposit ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>Deposit</span>
          </span>
        )}
        {platform.withdrawUrl && (
          <span
            onClick={handleCopyWithdraw}
            className="flex items-center gap-1 px-2 py-1 text-xs text-withdraw bg-withdraw/10 hover:bg-withdraw/20 rounded transition-colors cursor-pointer"
            title="Copy withdraw URL"
          >
            {copiedWithdraw ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>Withdraw</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Form Component
// ============================================

interface QuickTransactionFormProps {
  initialData: QuickTransactionPageData;
}

export function QuickTransactionForm({ initialData }: QuickTransactionFormProps) {
  const { success, error: showError } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [transactionType, setTransactionType] = React.useState<TransactionType>("deposit");
  const [gameId, setGameId] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [selectedChimeId, setSelectedChimeId] = React.useState<string | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = React.useState<string | null>(null);

  // UI State
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [highlightedSourceId, setHighlightedSourceId] = React.useState<string | null>(null);

  // Refs for keyboard shortcuts
  const amountInputRef = React.useRef<HTMLInputElement>(null);

  // Data from server
  const { chimeAccounts, platforms, games } = initialData;

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // D/W to toggle type (unless typing)
      if (!isTyping) {
        if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          setTransactionType("deposit");
        } else if (e.key.toLowerCase() === "w") {
          e.preventDefault();
          setTransactionType("withdraw");
        }
      }

      // Enter to submit (if not in textarea)
      if (e.key === "Enter" && target.tagName !== "TEXTAREA") {
        // Let form handle it
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ============================================
  // Handlers
  // ============================================

  const handleQuickAmount = (quickAmount: QuickAmount) => {
    setAmount(quickAmount.toString());
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleGameChange = (value: string) => {
    setGameId(value);
    if (errors.game) {
      setErrors((prev) => ({ ...prev, game: undefined }));
    }
  };

  const handleChimeSelect = (id: string) => {
    setSelectedChimeId(id);
    setSelectedPlatformId(null); // Mutual exclusion
    setHighlightedSourceId(null);
    if (errors.source) {
      setErrors((prev) => ({ ...prev, source: undefined }));
    }
  };

  const handlePlatformSelect = (id: string) => {
    setSelectedPlatformId(id);
    setSelectedChimeId(null); // Mutual exclusion
    setHighlightedSourceId(null);
    if (errors.source) {
      setErrors((prev) => ({ ...prev, source: undefined }));
    }
  };

  // ============================================
  // Validate
  // ============================================

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!gameId) {
      newErrors.game = "Please select a game";
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (!selectedChimeId && !selectedPlatformId) {
      newErrors.source = "Please select a source account";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [gameId, amount, selectedChimeId, selectedPlatformId]);

  // ============================================
  // Submit
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const sourceType = selectedChimeId ? "chime" : "platform";

      const result = await submitTransactionAction({
        direction: transactionType, // "deposit" | "withdraw"
        amount: parseFloat(amount),
        sourceType,
        chimeAccountId: selectedChimeId ?? undefined,
        paymentPlatformId: selectedPlatformId ?? undefined,
        gameId: gameId || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        // Clear form optimistically
        setAmount("");
        setNotes("");
        // Keep source selected for fast batch entry

        success(
          `${transactionType === "deposit" ? "Deposit" : "Withdrawal"} recorded!`,
          `$${parseFloat(amount).toFixed(2)} ${transactionType === "deposit" ? "deposited" : "withdrawn"}`
        );

        // Focus amount input for quick next entry
        amountInputRef.current?.focus();
      } else {
        // Handle errors
        const errorMessage = result.message || "Transaction failed";

        if (result.error === "MONTHLY_IN_LIMIT_EXCEEDED" || result.error === "MONTHLY_OUT_LIMIT_EXCEEDED") {
          // Highlight the selected account
          setHighlightedSourceId(selectedChimeId);
          showError("Limit Exceeded", errorMessage);
        } else if (result.error === "ATM_NOT_ENABLED") {
          setHighlightedSourceId(selectedChimeId);
          showError("ATM Not Enabled", errorMessage);
        } else {
          showError("Transaction Failed", errorMessage);
        }
      }
    });
  };

  const numericAmount = parseFloat(amount) || 0;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* LEFT COLUMN - Primary Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Transaction Type Toggle */}
          <TransactionTypeToggle
            value={transactionType}
            onChange={setTransactionType}
          />

          {/* Keyboard Shortcuts Hint */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Keyboard className="w-3 h-3" />
            <span>Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary">D</kbd> for deposit, <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary">W</kbd> for withdrawal</span>
          </div>

          {/* Game Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Game <span className="text-withdraw">*</span>
            </label>
            <Combobox
              value={gameId}
              onChange={handleGameChange}
              placeholder="Select game..."
              searchPlaceholder="Search games..."
              error={!!errors.game}
              options={games.map((game) => ({
                value: game.id,
                label: game.name,
                sublabel: game.tag || undefined,
              }))}
            />
            {errors.game && <p className="text-xs text-withdraw">{errors.game}</p>}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Amount <span className="text-withdraw">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                $
              </span>
              <Input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                error={!!errors.amount}
                className="pl-8 text-xl font-semibold"
              />
            </div>
            {errors.amount && <p className="text-xs text-withdraw">{errors.amount}</p>}
          </div>

          {/* Quick Amount Buttons */}
          <AmountQuickButtons selectedAmount={numericAmount} onSelect={handleQuickAmount} />

          {/* Notes */}
          <NotesInput value={notes} onChange={setNotes} />

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant={transactionType === "deposit" ? "deposit" : "withdraw"}
              size="lg"
              className="w-full uppercase tracking-wide"
              disabled={isPending}
            >
              {isPending
                ? "Processing..."
                : `Submit ${transactionType === "deposit" ? "Deposit" : "Withdrawal"}`}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Source Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chime Accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Chime Accounts
              </h2>
              {errors.source && (
                <p className="text-xs text-withdraw">{errors.source}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chimeAccounts.map((account) => (
                <ChimeAccountCard
                  key={account.id}
                  account={account}
                  isSelected={selectedChimeId === account.id}
                  onSelect={() => handleChimeSelect(account.id)}
                  hasError={highlightedSourceId === account.id}
                  transactionType={transactionType}
                />
              ))}
            </div>
          </div>

          {/* Payment Platforms */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary">
              Payment Platforms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  isSelected={selectedPlatformId === platform.id}
                  onSelect={() => handlePlatformSelect(platform.id)}
                  hasError={highlightedSourceId === platform.id}
                />
              ))}
            </div>
          </div>

          {/* Selected Summary */}
          {(selectedChimeId || selectedPlatformId) && (
            <div className="p-4 rounded-lg bg-holding-bg border border-holding">
              <p className="text-sm text-holding font-medium">
                Selected:{" "}
                {selectedChimeId
                  ? chimeAccounts.find((a) => a.id === selectedChimeId)?.nickname
                  : platforms.find((p) => p.id === selectedPlatformId)?.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
