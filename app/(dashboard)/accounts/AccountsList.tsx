"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, getProgressColor } from "@/lib/utils";
import {
  createChimeAccount,
  updateChimeAccount,
  deleteChimeAccount,
  reactivateChimeAccount,
  type ChimeAccountFull,
} from "./actions";
import {
  Plus,
  Pencil,
  X,
  Check,
  Wallet,
  AlertTriangle,
} from "lucide-react";

// ============================================
// Account Row Component
// ============================================

function AccountRow({
  account,
  onEdit,
  onDelete,
  onReactivate,
}: {
  account: ChimeAccountFull;
  onEdit: (account: ChimeAccountFull) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const inPercentage =
    account.monthlyInLimit > 0
      ? Math.round((account.currentMonthIn / account.monthlyInLimit) * 100)
      : 0;
  const outPercentage =
    account.monthlyOutLimit > 0
      ? Math.round((account.currentMonthOut / account.monthlyOutLimit) * 100)
      : 0;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteChimeAccount(account.id);
      if (result.success) {
        success("Account deactivated", `${account.nickname} will no longer appear in Quick Transaction`);
      } else {
        error("Failed to deactivate", result.error);
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      const result = await reactivateChimeAccount(account.id);
      if (result.success) {
        success("Account reactivated", `${account.nickname} is now active`);
      } else {
        error("Failed to reactivate", result.error);
      }
    });
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        account.status === "inactive"
          ? "bg-bg-tertiary border-border opacity-60"
          : "bg-bg-secondary border-border hover:border-border-focus"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-text-muted" />
            <span className="font-semibold text-text-primary">{account.nickname}</span>
            <Badge variant={account.type === "holding" ? "holding" : "paying"}>
              {account.type}
            </Badge>
            {account.status === "inactive" && (
              <Badge variant="default" className="bg-text-muted">Inactive</Badge>
            )}
          </div>

          {/* Tag & Balance */}
          <div className="flex gap-4 text-xs text-text-muted mb-2">
            {account.tag && <span className="text-text-secondary">{account.tag}</span>}
            <span>Balance: {formatCurrency(account.initialBalance ?? 0)}</span>
            {account.pin && <span>PIN: ••••</span>}
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            {/* IN Limit */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Monthly IN</span>
                <span className={cn(
                  "font-medium",
                  inPercentage >= 95 ? "text-withdraw" : inPercentage >= 80 ? "text-warning" : "text-text-secondary"
                )}>
                  {formatCurrency(account.currentMonthIn)} / {formatCurrency(account.monthlyInLimit)}
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", getProgressColor(inPercentage))}
                  style={{ width: `${Math.min(inPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* OUT Limit */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Monthly OUT</span>
                <span className={cn(
                  "font-medium",
                  outPercentage >= 95 ? "text-withdraw" : outPercentage >= 80 ? "text-warning" : "text-text-secondary"
                )}>
                  {formatCurrency(account.currentMonthOut)} / {formatCurrency(account.monthlyOutLimit)}
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", getProgressColor(outPercentage))}
                  style={{ width: `${Math.min(outPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ATM Status */}
          <div className="mt-2 text-xs text-text-muted">
            ATM: {account.atmWithdrawalEnabled ? "Enabled" : "Disabled"}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {account.status === "active" ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (account.status === "active") {
                  handleDelete();
                } else {
                  handleReactivate();
                }
              }}
              disabled={isPending}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                account.status === "active" ? "bg-deposit" : "bg-bg-tertiary"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  account.status === "active" ? "left-5" : "left-0.5"
                )}
              />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(account)}
            disabled={isPending}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Account Form (Create/Edit)
// ============================================

interface AccountFormProps {
  account?: ChimeAccountFull;
  onClose: () => void;
}

function AccountForm({ account, onClose }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [nickname, setNickname] = React.useState(account?.nickname ?? "");
  const [tag, setTag] = React.useState(account?.tag ?? "");
  const [type, setType] = React.useState<"holding" | "paying">(account?.type ?? "holding");
  const [monthlyInLimit, setMonthlyInLimit] = React.useState(
    account?.monthlyInLimit?.toString() ?? "10000"
  );
  const [monthlyOutLimit, setMonthlyOutLimit] = React.useState(
    account?.monthlyOutLimit?.toString() ?? "10000"
  );
  const [atmEnabled, setAtmEnabled] = React.useState(account?.atmWithdrawalEnabled ?? false);
  const [initialBalance, setInitialBalance] = React.useState(
    account?.initialBalance?.toString() ?? "0"
  );
  const [pin, setPin] = React.useState(account?.pin ?? "");

  const isEdit = !!account;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      error("Validation Error", "Nickname is required");
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updateChimeAccount({
          id: account.id,
          nickname: nickname.trim(),
          tag: tag.trim() || null,
          type,
          monthlyInLimit: parseFloat(monthlyInLimit) || 0,
          monthlyOutLimit: parseFloat(monthlyOutLimit) || 0,
          atmWithdrawalEnabled: atmEnabled,
          initialBalance: parseFloat(initialBalance) || 0,
          pin: pin.trim() || null,
        });
        if (result.success) {
          success("Account updated", `${nickname} has been updated`);
          onClose();
        } else {
          error("Failed to update", result.error);
        }
      } else {
        const result = await createChimeAccount({
          nickname: nickname.trim(),
          tag: tag.trim() || undefined,
          type,
          monthlyInLimit: parseFloat(monthlyInLimit) || 0,
          monthlyOutLimit: parseFloat(monthlyOutLimit) || 0,
          atmWithdrawalEnabled: atmEnabled,
          initialBalance: parseFloat(initialBalance) || 0,
          pin: pin.trim() || undefined,
        });
        if (result.success) {
          success("Account created", `${nickname} has been created`);
          onClose();
        } else {
          error("Failed to create", result.error);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? "Edit Account" : "New Chime Account"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Nickname & Tag */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Nickname <span className="text-withdraw">*</span>
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., Chime Main"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Tag</label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g., $Kenneth-Jones-634"
              />
            </div>
          </div>

          {/* Row 2: Type & Initial Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as "holding" | "paying")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holding">Holding</SelectItem>
                  <SelectItem value="paying">Paying</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Initial Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Monthly Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Monthly IN Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={monthlyInLimit}
                  onChange={(e) => setMonthlyInLimit(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Monthly OUT Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={monthlyOutLimit}
                  onChange={(e) => setMonthlyOutLimit(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* Row 4: PIN & ATM Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">PIN</label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="4-digit PIN"
                maxLength={4}
              />
            </div>
            <div className="flex items-center justify-between py-2 pt-7">
              <label className="text-sm font-medium text-text-primary">
                ATM Withdrawal
              </label>
              <button
                type="button"
                onClick={() => setAtmEnabled(!atmEnabled)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  atmEnabled ? "bg-deposit" : "bg-bg-tertiary"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    atmEnabled ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="deposit"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Main Accounts List Component
// ============================================

interface AccountsListProps {
  initialAccounts: ChimeAccountFull[];
}

export function AccountsList({ initialAccounts }: AccountsListProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<ChimeAccountFull | undefined>();
  const [showInactive, setShowInactive] = React.useState(false);

  const activeAccounts = initialAccounts.filter((a) => a.status === "active");
  const inactiveAccounts = initialAccounts.filter((a) => a.status === "inactive");

  const handleEdit = (account: ChimeAccountFull) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingAccount(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Active Accounts ({activeAccounts.length})
          </h2>
          <p className="text-sm text-text-secondary">
            Manage Chime account limits and settings
          </p>
        </div>
        <Button variant="deposit" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Active Accounts */}
      <div className="space-y-3">
        {activeAccounts.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No active accounts. Click "Add Account" to create one.
          </div>
        ) : (
          activeAccounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={() => {}}
              onReactivate={() => {}}
            />
          ))
        )}
      </div>

      {/* Inactive Accounts Toggle */}
      {inactiveAccounts.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {showInactive ? "Hide" : "Show"} inactive accounts ({inactiveAccounts.length})
          </button>

          {showInactive && (
            <div className="mt-4 space-y-3">
              {inactiveAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={handleEdit}
                  onDelete={() => {}}
                  onReactivate={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && <AccountForm account={editingAccount} onClose={handleClose} />}
    </div>
  );
}
