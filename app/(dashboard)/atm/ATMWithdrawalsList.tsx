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
import { cn, formatCurrency } from "@/lib/utils";
import {
  createATMWithdrawal,
  deleteATMWithdrawal,
  type ATMWithdrawal,
  type ChimeAccountForATM,
} from "./actions";
import { Plus, X, Trash2, Wallet, Calendar, DollarSign } from "lucide-react";

// ============================================
// Main Component
// ============================================

interface ATMWithdrawalsListProps {
  initialWithdrawals: ATMWithdrawal[];
  atmAccounts: ChimeAccountForATM[];
}

export function ATMWithdrawalsList({
  initialWithdrawals,
  atmAccounts,
}: ATMWithdrawalsListProps) {
  const [withdrawals, setWithdrawals] = React.useState(initialWithdrawals);
  const [showForm, setShowForm] = React.useState(false);
  const [filterAccountId, setFilterAccountId] = React.useState<string>("all");

  const filteredWithdrawals = filterAccountId === "all"
    ? withdrawals
    : withdrawals.filter((w) => w.chimeAccountId === filterAccountId);

  // Calculate totals
  const totalAmount = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  // Group by account for summary
  const summaryByAccount = React.useMemo(() => {
    const map = new Map<string, { nickname: string; tag: string | null; total: number; count: number }>();
    for (const w of withdrawals) {
      const existing = map.get(w.chimeAccountId);
      if (existing) {
        existing.total += w.amount;
        existing.count += 1;
      } else {
        map.set(w.chimeAccountId, {
          nickname: w.chimeNickname,
          tag: w.chimeTag,
          total: w.amount,
          count: 1,
        });
      }
    }
    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data }));
  }, [withdrawals]);

  const handleWithdrawalCreated = (newWithdrawal: ATMWithdrawal) => {
    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    setShowForm(false);
  };

  const handleWithdrawalDeleted = (id: string) => {
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">ATM Withdrawals</h1>
          <p className="text-sm text-text-muted">
            Track ATM withdrawals for enabled Chime accounts
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={atmAccounts.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Record Withdrawal
        </Button>
      </div>

      {atmAccounts.length === 0 && (
        <div className="bg-warning/10 border border-warning rounded-lg p-4 text-warning text-sm">
          No Chime accounts have ATM withdrawal enabled. Enable ATM in the Accounts settings first.
        </div>
      )}

      {/* Summary Cards */}
      {summaryByAccount.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {summaryByAccount.map((account) => (
            <div
              key={account.id}
              onClick={() => setFilterAccountId(filterAccountId === account.id ? "all" : account.id)}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all",
                filterAccountId === account.id
                  ? "border-holding bg-holding-bg"
                  : "border-border bg-bg-secondary hover:border-border-focus"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-text-muted" />
                <span className="font-semibold text-sm text-text-primary truncate">
                  {account.nickname}
                </span>
              </div>
              {account.tag && (
                <p className="text-xs text-text-muted mb-2">{account.tag}</p>
              )}
              <div className="flex justify-between items-end">
                <span className="text-xs text-text-muted">{account.count} withdrawals</span>
                <span className="text-lg font-bold text-withdraw">
                  {formatCurrency(account.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter & Total */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Filter:</span>
          <Select value={filterAccountId} onValueChange={setFilterAccountId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {atmAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.nickname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          Total: <span className="font-bold text-withdraw">{formatCurrency(totalAmount)}</span>
          <span className="text-text-muted ml-2">({filteredWithdrawals.length} records)</span>
        </div>
      </div>

      {/* Withdrawal List */}
      <div className="space-y-3">
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No ATM withdrawals recorded yet
          </div>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <WithdrawalRow
              key={withdrawal.id}
              withdrawal={withdrawal}
              onDelete={handleWithdrawalDeleted}
            />
          ))
        )}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <WithdrawalForm
          accounts={atmAccounts}
          onClose={() => setShowForm(false)}
          onCreated={handleWithdrawalCreated}
        />
      )}
    </div>
  );
}

// ============================================
// Withdrawal Row
// ============================================

function WithdrawalRow({
  withdrawal,
  onDelete,
}: {
  withdrawal: ATMWithdrawal;
  onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const handleDelete = () => {
    if (!confirm("Delete this ATM withdrawal record?")) return;

    startTransition(async () => {
      const result = await deleteATMWithdrawal(withdrawal.id);
      if (result.success) {
        success("Deleted", "ATM withdrawal record deleted");
        onDelete(withdrawal.id);
      } else {
        error("Failed to delete", result.error);
      }
    });
  };

  const formattedDate = new Date(withdrawal.withdrawnAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between p-4 bg-bg-secondary border border-border rounded-lg hover:border-border-focus transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-text-muted w-28 flex-shrink-0">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>

        {/* Account */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge variant="holding">{withdrawal.chimeNickname}</Badge>
          {withdrawal.chimeTag && (
            <span className="text-xs text-text-muted truncate">{withdrawal.chimeTag}</span>
          )}
        </div>

        {/* Notes */}
        {withdrawal.notes && (
          <span className="text-sm text-text-muted truncate max-w-48">
            {withdrawal.notes}
          </span>
        )}
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-lg font-bold text-withdraw">
          {formatCurrency(withdrawal.amount)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-text-muted hover:text-withdraw hover:bg-withdraw/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Withdrawal Form Modal
// ============================================

function WithdrawalForm({
  accounts,
  onClose,
  onCreated,
}: {
  accounts: ChimeAccountForATM[];
  onClose: () => void;
  onCreated: (withdrawal: ATMWithdrawal) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [accountId, setAccountId] = React.useState(accounts[0]?.id || "");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || !amount || !date) {
      error("Validation Error", "Please fill in all required fields");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error("Validation Error", "Please enter a valid amount");
      return;
    }

    startTransition(async () => {
      const result = await createATMWithdrawal({
        chimeAccountId: accountId,
        amount: parsedAmount,
        withdrawnAt: date,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        success("Recorded", "ATM withdrawal recorded successfully");
        
        // Create a fake withdrawal object for optimistic update
        const selectedAccount = accounts.find((a) => a.id === accountId);
        const newWithdrawal: ATMWithdrawal = {
          id: crypto.randomUUID(),
          chimeAccountId: accountId,
          chimeNickname: selectedAccount?.nickname || "",
          chimeTag: selectedAccount?.tag || null,
          amount: parsedAmount,
          withdrawnAt: date,
          notes: notes.trim() || null,
          recordedBy: "",
          recordedByName: null,
          createdAt: new Date().toISOString(),
        };
        onCreated(newWithdrawal);
      } else {
        error("Failed to record", result.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Record ATM Withdrawal
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Chime Account <span className="text-withdraw">*</span>
            </label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.nickname}
                    {account.tag && ` (${account.tag})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Amount <span className="text-withdraw">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Date <span className="text-withdraw">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Recording..." : "Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
