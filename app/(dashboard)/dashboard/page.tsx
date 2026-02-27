import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { loadDashboardData } from "./actions";
import { cn, formatCurrency, getProgressColor } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

// ============================================
// Stat Card Component
// ============================================

function StatCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant: "deposit" | "withdraw" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-muted">{title}</span>
        <Icon
          className={cn(
            "w-5 h-5",
            variant === "deposit"
              ? "text-deposit"
              : variant === "withdraw"
              ? "text-withdraw"
              : "text-text-muted"
          )}
        />
      </div>
      <p
        className={cn(
          "text-2xl font-bold",
          variant === "deposit"
            ? "text-deposit"
            : variant === "withdraw"
            ? "text-withdraw"
            : "text-text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================
// Near Limit Account Card
// ============================================

function NearLimitCard({
  account,
}: {
  account: {
    id: string;
    nickname: string;
    type: "holding" | "paying";
    inPercentage: number;
    outPercentage: number;
    isInCritical: boolean;
    isOutCritical: boolean;
    remainingIn: number;
    remainingOut: number;
  };
}) {
  const maxPercentage = Math.max(account.inPercentage, account.outPercentage);
  const isCritical = account.isInCritical || account.isOutCritical;

  return (
    <Link
      href="/accounts"
      className={cn(
        "block p-4 rounded-lg border transition-all hover:border-border-focus",
        isCritical
          ? "border-withdraw/50 bg-withdraw/5"
          : "border-warning/50 bg-warning/5"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-text-muted" />
          <span className="font-medium text-text-primary">{account.nickname}</span>
        </div>
        <div className="flex items-center gap-2">
          {isCritical ? (
            <AlertCircle className="w-4 h-4 text-withdraw" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
          <Badge variant={account.type === "holding" ? "holding" : "paying"}>
            {account.type}
          </Badge>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2">
        {account.inPercentage >= 80 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">IN</span>
              <span
                className={cn(
                  "font-medium",
                  account.isInCritical ? "text-withdraw" : "text-warning"
                )}
              >
                {account.inPercentage}% • {formatCurrency(account.remainingIn)} left
              </span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", getProgressColor(account.inPercentage))}
                style={{ width: `${Math.min(account.inPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
        {account.outPercentage >= 80 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">OUT</span>
              <span
                className={cn(
                  "font-medium",
                  account.isOutCritical ? "text-withdraw" : "text-warning"
                )}
              >
                {account.outPercentage}% • {formatCurrency(account.remainingOut)} left
              </span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", getProgressColor(account.outPercentage))}
                style={{ width: `${Math.min(account.outPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================
// Recent Transaction Row
// ============================================

function TransactionRow({
  tx,
}: {
  tx: {
    id: string;
    direction: "in" | "out";
    amount: number;
    sourceName: string;
    gameName: string | null;
    createdAt: string;
  };
}) {
  const time = new Date(tx.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        {tx.direction === "in" ? (
          <ArrowDownCircle className="w-5 h-5 text-deposit" />
        ) : (
          <ArrowUpCircle className="w-5 h-5 text-withdraw" />
        )}
        <div>
          <p className="text-sm font-medium text-text-primary">{tx.sourceName}</p>
          <p className="text-xs text-text-muted">
            {tx.gameName || "No game"} • {time}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "font-mono font-medium",
          tx.direction === "in" ? "text-deposit" : "text-withdraw"
        )}
      >
        {tx.direction === "in" ? "+" : "-"}
        {formatCurrency(tx.amount)}
      </span>
    </div>
  );
}

// ============================================
// Main Dashboard Page
// ============================================

export default async function DashboardPage() {
  const { data, error } = await loadDashboardData();

  if (error || !data) {
    return (
      <>
        <Header title="DASHBOARD" />
        <div className="p-6">
          <div className="max-w-md mx-auto text-center space-y-4 py-12">
            <AlertCircle className="w-12 h-12 text-withdraw mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary">
              Failed to load dashboard
            </h2>
            <p className="text-text-secondary">
              {error || "Unable to connect to the database. Please try again."}
            </p>
          </div>
        </div>
      </>
    );
  }

  const { stats, nearLimitAccounts, recentTransactions } = data;

  return (
    <>
      <Header title="DASHBOARD" />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today's Deposits"
              value={formatCurrency(stats.todayDeposits)}
              icon={ArrowDownCircle}
              variant="deposit"
            />
            <StatCard
              title="Today's Withdrawals"
              value={formatCurrency(stats.todayWithdrawals)}
              icon={ArrowUpCircle}
              variant="withdraw"
            />
            <StatCard
              title="Net Today"
              value={formatCurrency(stats.todayNet)}
              icon={TrendingUp}
              variant={stats.todayNet >= 0 ? "deposit" : "withdraw"}
            />
            <StatCard
              title="Transactions"
              value={stats.transactionCount.toString()}
              icon={Clock}
              variant="neutral"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Near Limit Accounts */}
            <div className="rounded-lg border border-border bg-bg-secondary p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  Accounts Near Limit
                </h2>
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              {nearLimitAccounts.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  All accounts are within safe limits
                </div>
              ) : (
                <div className="space-y-3">
                  {nearLimitAccounts.map((account) => (
                    <NearLimitCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="rounded-lg border border-border bg-bg-secondary p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  Today's Transactions
                </h2>
                <Link
                  href="/history"
                  className="text-sm text-holding hover:text-holding/80 transition-colors"
                >
                  View all
                </Link>
              </div>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  No transactions today
                </div>
              ) : (
                <div>
                  {recentTransactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
