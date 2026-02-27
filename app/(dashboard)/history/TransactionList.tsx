"use client";

import { useState, useEffect, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getTransactions, getFilterOptions, Transaction } from "./actions";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

interface FilterOptions {
  chimeAccounts: Array<{ id: string; nickname: string }>;
  platforms: Array<{ id: string; name: string }>;
  games: Array<{ id: string; name: string }>;
}

interface TransactionListProps {
  initialTransactions: Transaction[];
  initialTotal: number;
  filterOptions: FilterOptions;
}

const PAGE_SIZE = 25;

export function TransactionList({
  initialTransactions,
  initialTotal,
  filterOptions,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [direction, setDirection] = useState<"" | "deposit" | "withdraw">("");
  const [sourceType, setSourceType] = useState<"" | "chime" | "platform">("");
  const [chimeAccountId, setChimeAccountId] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [gameId, setGameId] = useState("");
  
  // Pagination
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadTransactions = () => {
    startTransition(async () => {
      const result = await getTransactions({
        direction: direction || undefined,
        sourceType: sourceType || undefined,
        chimeAccountId: chimeAccountId || undefined,
        paymentPlatformId: platformId || undefined,
        gameId: gameId || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      
      if (result.data) {
        setTransactions(result.data);
        setTotal(result.total);
      }
    });
  };

  useEffect(() => {
    loadTransactions();
  }, [page, direction, sourceType, chimeAccountId, platformId, gameId]);

  const clearFilters = () => {
    setDirection("");
    setSourceType("");
    setChimeAccountId("");
    setPlatformId("");
    setGameId("");
    setPage(0);
  };

  const hasFilters = direction || sourceType || chimeAccountId || platformId || gameId;

  const getSourceDisplay = (txn: Transaction) => {
    if (txn.sourceType === "chime") {
      return txn.chimeNickname || "Unknown Chime";
    }
    return txn.platformName || "Unknown Platform";
  };

  return (
    <div>
      {/* Filter Toggle */}
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2 text-text-muted"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
        <div className="ml-auto text-sm text-text-muted">
          {total} transaction{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Type
            </label>
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as "" | "deposit" | "withdraw");
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary"
            >
              <option value="">All</option>
              <option value="deposit">Deposits</option>
              <option value="withdraw">Withdrawals</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value as "" | "chime" | "platform");
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary"
            >
              <option value="">All</option>
              <option value="chime">Chime</option>
              <option value="platform">Platform</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Chime Account
            </label>
            <select
              value={chimeAccountId}
              onChange={(e) => {
                setChimeAccountId(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary"
            >
              <option value="">All</option>
              {filterOptions.chimeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nickname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Platform
            </label>
            <select
              value={platformId}
              onChange={(e) => {
                setPlatformId(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary"
            >
              <option value="">All</option>
              {filterOptions.platforms.map((plat) => (
                <option key={plat.id} value={plat.id}>
                  {plat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Game
            </label>
            <select
              value={gameId}
              onChange={(e) => {
                setGameId(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary"
            >
              <option value="">All</option>
              {filterOptions.games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                Game
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                Source
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                Operator
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className={isPending ? "opacity-50" : ""}>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-text-muted">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-border hover:bg-bg-tertiary transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {formatDate(txn.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={txn.direction === "deposit" ? "deposit" : "withdraw"}
                    >
                      {txn.direction}
                      {txn.withdrawSubtype === "atm" && " (ATM)"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-primary">
                    {txn.gameName || "-"}
                    {txn.gameTag && (
                      <span className="ml-2 text-text-muted text-xs">
                        @{txn.gameTag}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    <span className="text-xs uppercase text-text-muted mr-1">
                      {txn.sourceType}:
                    </span>
                    {getSourceDisplay(txn)}
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {txn.operatorName || "-"}
                  </td>
                  <td
                    className={`py-3 px-4 text-sm text-right font-mono font-semibold ${
                      txn.direction === "deposit" ? "text-deposit" : "text-withdraw"
                    }`}
                  >
                    {txn.direction === "deposit" ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-text-muted">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isPending}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
