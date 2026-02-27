"use client";

import { useState, useEffect, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { getMonthlyReport, MonthlyReport } from "./actions";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity,
  PiggyBank,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportDashboardProps {
  initialReport: MonthlyReport | null;
  availableMonths: Array<{ value: string; label: string }>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: "green" | "red" | "blue" | "yellow" | "purple";
  subtext?: string;
}) {
  const colorClasses = {
    green: "from-green-500/20 to-green-500/5 text-green-400",
    red: "from-red-500/20 to-red-500/5 text-red-400",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
    yellow: "from-yellow-500/20 to-yellow-500/5 text-yellow-400",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-400",
  };

  const iconColorClasses = {
    green: "bg-green-500/20 text-green-400",
    red: "bg-red-500/20 text-red-400",
    blue: "bg-blue-500/20 text-blue-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} p-6 border border-border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {subtext && (
            <p className="mt-2 text-sm text-text-muted">{subtext}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function ReportDashboard({ initialReport, availableMonths }: ReportDashboardProps) {
  // Default report with zeros if none provided
  const defaultReport: MonthlyReport = {
    month: availableMonths[0]?.value || "",
    monthDisplay: availableMonths[0]?.label || "Current Month",
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalATMWithdrawals: 0,
    netFlow: 0,
    currentHolding: 0,
    transactionCount: 0,
  };
  
  const [report, setReport] = useState(initialReport || defaultReport);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]?.value || "");
  const [isPending, startTransition] = useTransition();

  const loadReport = (monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    startTransition(async () => {
      const result = await getMonthlyReport(year, month);
      if (result.data) {
        setReport(result.data);
      }
    });
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const currentIndex = availableMonths.findIndex((m) => m.value === selectedMonth);
    if (direction === "prev" && currentIndex < availableMonths.length - 1) {
      const newMonth = availableMonths[currentIndex + 1].value;
      setSelectedMonth(newMonth);
      loadReport(newMonth);
    } else if (direction === "next" && currentIndex > 0) {
      const newMonth = availableMonths[currentIndex - 1].value;
      setSelectedMonth(newMonth);
      loadReport(newMonth);
    }
  };

  const currentMonthIndex = availableMonths.findIndex((m) => m.value === selectedMonth);
  const canGoPrev = currentMonthIndex < availableMonths.length - 1;
  const canGoNext = currentMonthIndex > 0;

  return (
    <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      {/* Month Selector */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleMonthChange("prev")}
          disabled={!canGoPrev || isPending}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-text-primary min-w-[200px] text-center">
          {report.monthDisplay}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleMonthChange("next")}
          disabled={!canGoNext || isPending}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Deposits"
          value={formatCurrency(report.totalDeposits)}
          icon={TrendingUp}
          color="green"
          subtext="This month"
        />

        <StatCard
          title="Total Withdrawals"
          value={formatCurrency(report.totalWithdrawals)}
          icon={TrendingDown}
          color="red"
          subtext="This month"
        />

        <StatCard
          title="ATM Withdrawals"
          value={formatCurrency(report.totalATMWithdrawals)}
          icon={Wallet}
          color="yellow"
          subtext="This month"
        />

        <StatCard
          title="Net Flow"
          value={`${report.netFlow >= 0 ? "+" : ""}${formatCurrency(report.netFlow)}`}
          icon={Activity}
          color={report.netFlow >= 0 ? "blue" : "red"}
          subtext="Deposits - Withdrawals"
        />

        <StatCard
          title="Current Holdings"
          value={formatCurrency(report.currentHolding)}
          icon={PiggyBank}
          color="purple"
          subtext="Active Chime accounts"
        />

        <div className="rounded-xl bg-bg-secondary p-6 border border-border">
          <p className="text-sm font-medium text-text-muted mb-1">Transactions</p>
          <p className="text-3xl font-bold text-text-primary">{report.transactionCount}</p>
          <p className="mt-2 text-sm text-text-muted">
            Recorded this month
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mt-8 bg-bg-secondary rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-text-muted">Gross Volume</p>
            <p className="text-xl font-bold text-text-primary">
              {formatCurrency(report.totalDeposits + report.totalWithdrawals)}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Avg Per Transaction</p>
            <p className="text-xl font-bold text-text-primary">
              {report.transactionCount > 0 
                ? formatCurrency((report.totalDeposits + report.totalWithdrawals) / report.transactionCount)
                : "$0.00"
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Cash Out</p>
            <p className="text-xl font-bold text-withdraw">
              {formatCurrency(report.totalWithdrawals + report.totalATMWithdrawals)}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Retention Rate</p>
            <p className="text-xl font-bold text-text-primary">
              {report.totalDeposits > 0 
                ? `${Math.round(((report.totalDeposits - report.totalWithdrawals) / report.totalDeposits) * 100)}%`
                : "N/A"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 text-center text-sm text-text-muted">
        Reports reset automatically at the start of each month.
      </div>
    </div>
  );
}
