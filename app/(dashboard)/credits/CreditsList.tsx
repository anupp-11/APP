"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  loadPlayerCredits,
  loadCreditTransactions,
  addCredit,
  payCredit,
  deleteCreditTransaction,
  PlayerCredit,
  CreditTransaction,
} from "./actions";
import { createPlayer } from "../players/actions";
import {
  Plus,
  Minus,
  X,
  Search,
  History,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
} from "lucide-react";

// ============================================
// Format Helpers
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ============================================
// Add Player Form Modal
// ============================================

function AddPlayerFormModal({
  onClose,
  onRefresh,
}: {
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [name, setName] = React.useState("");
  const [fbLink, setFbLink] = React.useState("");
  const [friendOn, setFriendOn] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Validation Error", "Name is required");
      return;
    }

    startTransition(async () => {
      const result = await createPlayer({
        name: name.trim(),
        fbLink: fbLink.trim() || undefined,
        friendOn: friendOn.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result.success) {
        success("Player added", `${name} has been added`);
        onRefresh();
        onClose();
      } else {
        error("Failed to add", result.error || "Unknown error");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Add Player</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Name <span className="text-withdraw">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Facebook Link
            </label>
            <Input
              value={fbLink}
              onChange={(e) => setFbLink(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Friend On (FB Account Name)
            </label>
            <Input
              value={friendOn}
              onChange={(e) => setFriendOn(e.target.value)}
              placeholder="Name of your FB account"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Notes
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving..." : "Add Player"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Credit Table Row
// ============================================

function CreditTableRow({
  credit,
  onAddCredit,
  onPayCredit,
  onViewHistory,
}: {
  credit: PlayerCredit;
  onAddCredit: (credit: PlayerCredit) => void;
  onPayCredit: (credit: PlayerCredit) => void;
  onViewHistory: (credit: PlayerCredit) => void;
}) {
  const isPositive = credit.balance > 0;
  const isNegative = credit.balance < 0;

  return (
    <tr className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
      <td className="py-3 px-4 font-medium text-text-primary">
        {credit.playerName}
      </td>
      <td className="py-3 px-4 text-text-secondary">
        {credit.friendOn || "-"}
      </td>
      <td className="py-3 px-4">
        <span
          className={cn(
            "font-semibold",
            isPositive && "text-deposit",
            isNegative && "text-withdraw",
            !isPositive && !isNegative && "text-text-muted"
          )}
        >
          {formatCurrency(credit.balance)}
        </span>
      </td>
      <td className="py-3 px-4 text-text-secondary text-sm">
        {credit.transactionCount} txn{credit.transactionCount !== 1 ? "s" : ""}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddCredit(credit)}
            className="text-deposit hover:text-deposit hover:bg-deposit/10"
            title="Add Credit"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPayCredit(credit)}
            className="text-withdraw hover:text-withdraw hover:bg-withdraw/10"
            title="Pay Credit"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(credit)}
            title="View History"
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Add/Pay Credit Modal
// ============================================

function CreditFormModal({
  player,
  type,
  onClose,
  onRefresh,
}: {
  player: PlayerCredit;
  type: "add" | "pay";
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const [amount, setAmount] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const isAdd = type === "add";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error("Validation Error", "Please enter a valid amount");
      return;
    }

    startTransition(async () => {
      const action = isAdd ? addCredit : payCredit;
      const result = await action({
        playerId: player.playerId,
        amount: parsedAmount,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        success(
          isAdd ? "Credit Added" : "Credit Paid",
          `${formatCurrency(parsedAmount)} ${isAdd ? "added to" : "paid from"} ${player.playerName}`
        );
        onRefresh();
        onClose();
      } else {
        error("Failed", result.error || "Unknown error");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {isAdd ? "Add Credit" : "Pay Credit"} - {player.playerName}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
          <p className="text-sm text-text-muted">Current Balance</p>
          <p
            className={cn(
              "text-xl font-bold",
              player.balance > 0 && "text-deposit",
              player.balance < 0 && "text-withdraw",
              player.balance === 0 && "text-text-muted"
            )}
          >
            {formatCurrency(player.balance)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Amount <span className="text-withdraw">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Notes
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex-1",
                isAdd
                  ? "bg-deposit hover:bg-deposit/90"
                  : "bg-withdraw hover:bg-withdraw/90"
              )}
            >
              {isPending ? "Processing..." : isAdd ? "Add Credit" : "Pay Credit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Transaction History Modal
// ============================================

function HistoryModal({
  player,
  onClose,
}: {
  player: PlayerCredit;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = React.useState<CreditTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const loadTransactions = React.useCallback(async () => {
    setLoading(true);
    const result = await loadCreditTransactions(player.playerId);
    if (result.data) {
      setTransactions(result.data);
    }
    setLoading(false);
  }, [player.playerId]);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = (txn: CreditTransaction) => {
    if (!confirm(`Delete this ${txn.type} transaction of ${formatCurrency(Math.abs(txn.amount))}?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCreditTransaction(txn.id);
      if (result.success) {
        success("Deleted", "Transaction has been removed");
        loadTransactions();
      } else {
        error("Failed", result.error || "Unknown error");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Credit History - {player.playerName}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
          <p className="text-sm text-text-muted">Current Balance</p>
          <p
            className={cn(
              "text-xl font-bold",
              player.balance > 0 && "text-deposit",
              player.balance < 0 && "text-withdraw",
              player.balance === 0 && "text-text-muted"
            )}
          >
            {formatCurrency(player.balance)}
          </p>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-8 text-text-muted">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No transactions yet
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-bg-tertiary sticky top-0">
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-left text-sm font-medium text-text-secondary">
                    Date
                  </th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-text-secondary">
                    Type
                  </th>
                  <th className="py-2 px-3 text-right text-sm font-medium text-text-secondary">
                    Amount
                  </th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-text-secondary">
                    Notes
                  </th>
                  <th className="py-2 px-3 text-left text-sm font-medium text-text-secondary">
                    By
                  </th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className={cn(
                      "border-b border-border hover:bg-bg-tertiary/50",
                      isPending && "opacity-50"
                    )}
                  >
                    <td className="py-2 px-3 text-sm text-text-secondary">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-medium",
                          txn.type === "add" ? "text-deposit" : "text-withdraw"
                        )}
                      >
                        {txn.type === "add" ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {txn.type === "add" ? "Add" : "Pay"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-2 px-3 text-right font-medium",
                        txn.type === "add" ? "text-deposit" : "text-withdraw"
                      )}
                    >
                      {txn.type === "add" ? "+" : "-"}
                      {formatCurrency(Math.abs(txn.amount))}
                    </td>
                    <td className="py-2 px-3 text-sm text-text-secondary max-w-[150px] truncate">
                      {txn.notes || "-"}
                    </td>
                    <td className="py-2 px-3 text-sm text-text-muted">
                      {txn.createdByName || "Unknown"}
                    </td>
                    <td className="py-2 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(txn)}
                        disabled={isPending}
                        className="text-withdraw hover:text-withdraw hover:bg-withdraw/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Credits List Component
// ============================================

interface CreditsListProps {
  initialCredits: PlayerCredit[];
}

export function CreditsList({ initialCredits }: CreditsListProps) {
  const [credits, setCredits] = React.useState(initialCredits);
  const [search, setSearch] = React.useState("");
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<PlayerCredit | null>(null);

  // Refresh credits from server
  const refreshCredits = React.useCallback(async () => {
    const result = await loadPlayerCredits();
    if (result.data && !result.error) {
      setCredits(result.data);
    }
  }, []);

  // Filter credits based on search
  const filteredCredits = React.useMemo(() => {
    if (!search) return credits;
    const lowerSearch = search.toLowerCase();
    return credits.filter(
      (c) =>
        c.playerName.toLowerCase().includes(lowerSearch) ||
        c.friendOn?.toLowerCase().includes(lowerSearch)
    );
  }, [credits, search]);

  const handleAddCredit = (credit: PlayerCredit) => {
    setSelectedPlayer(credit);
    setShowAddModal(true);
  };

  const handlePayCredit = (credit: PlayerCredit) => {
    setSelectedPlayer(credit);
    setShowPayModal(true);
  };

  const handleViewHistory = (credit: PlayerCredit) => {
    setSelectedPlayer(credit);
    setShowHistoryModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowPayModal(false);
    setShowHistoryModal(false);
    setShowAddPlayerModal(false);
    setSelectedPlayer(null);
  };

  // Calculate totals
  const totals = React.useMemo(() => {
    const totalPositive = credits
      .filter((c) => c.balance > 0)
      .reduce((sum, c) => sum + c.balance, 0);
    const totalNegative = credits
      .filter((c) => c.balance < 0)
      .reduce((sum, c) => sum + c.balance, 0);
    return { totalPositive, totalNegative, net: totalPositive + totalNegative };
  }, [credits]);

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-bg-secondary border border-border rounded-lg">
          <p className="text-sm text-text-muted mb-1">Total Owed to Players</p>
          <p className="text-xl font-bold text-deposit">
            {formatCurrency(totals.totalPositive)}
          </p>
        </div>
        <div className="p-4 bg-bg-secondary border border-border rounded-lg">
          <p className="text-sm text-text-muted mb-1">Total Players Owe</p>
          <p className="text-xl font-bold text-withdraw">
            {formatCurrency(Math.abs(totals.totalNegative))}
          </p>
        </div>
        <div className="p-4 bg-bg-secondary border border-border rounded-lg">
          <p className="text-sm text-text-muted mb-1">Net Balance</p>
          <p
            className={cn(
              "text-xl font-bold",
              totals.net > 0 && "text-deposit",
              totals.net < 0 && "text-withdraw",
              totals.net === 0 && "text-text-muted"
            )}
          >
            {formatCurrency(totals.net)}
          </p>
        </div>
      </div>

      {/* Search and Add Player */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowAddPlayerModal(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Player
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-text-muted">
        {filteredCredits.length} player{filteredCredits.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </div>

      {/* Credits Table */}
      {filteredCredits.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          {search
            ? "No players match your search"
            : "No players yet. Add players first in the Players tab."}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Player Name
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Friend On
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Balance
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Transactions
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map((credit) => (
                <CreditTableRow
                  key={credit.playerId}
                  credit={credit}
                  onAddCredit={handleAddCredit}
                  onPayCredit={handlePayCredit}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAddModal && selectedPlayer && (
        <CreditFormModal
          player={selectedPlayer}
          type="add"
          onClose={handleCloseModals}
          onRefresh={refreshCredits}
        />
      )}

      {showPayModal && selectedPlayer && (
        <CreditFormModal
          player={selectedPlayer}
          type="pay"
          onClose={handleCloseModals}
          onRefresh={refreshCredits}
        />
      )}

      {showHistoryModal && selectedPlayer && (
        <HistoryModal player={selectedPlayer} onClose={handleCloseModals} />
      )}

      {showAddPlayerModal && (
        <AddPlayerFormModal
          onClose={handleCloseModals}
          onRefresh={refreshCredits}
        />
      )}
    </div>
  );
}
