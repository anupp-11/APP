"use server";

import { createAdminClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export interface DashboardStats {
  todayDeposits: number;
  todayWithdrawals: number;
  todayNet: number;
  transactionCount: number;
}

export interface NearLimitAccount {
  id: string;
  nickname: string;
  type: "holding" | "paying";
  inPercentage: number;
  outPercentage: number;
  isInCritical: boolean;
  isOutCritical: boolean;
  remainingIn: number;
  remainingOut: number;
}

export interface RecentTransaction {
  id: string;
  direction: "in" | "out";
  amount: number;
  sourceType: "chime" | "platform";
  sourceName: string;
  gameName: string | null;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  nearLimitAccounts: NearLimitAccount[];
  recentTransactions: RecentTransaction[];
}

// ============================================
// Load Dashboard Data
// ============================================

export async function loadDashboardData(): Promise<{
  data: DashboardData | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Run queries in parallel
  const [todayResult, accountsResult, recentResult] = await Promise.all([
    // Today's summary
    supabase.rpc("get_today_summary"),
    
    // Accounts with monthly totals
    supabase.from("chime_accounts_with_totals").select("*").eq("status", "active"),
    
    // Recent transactions
    supabase
      .from("today_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (todayResult.error) {
    console.error("Error loading today summary:", todayResult.error);
    return { data: null, error: todayResult.error.message };
  }

  if (accountsResult.error) {
    console.error("Error loading accounts:", accountsResult.error);
    return { data: null, error: accountsResult.error.message };
  }

  // Transform data
  const todayData = todayResult.data as {
    today_deposits: number;
    today_withdrawals: number;
    today_net: number;
    transaction_count: number;
  };

  const stats: DashboardStats = {
    todayDeposits: Number(todayData?.today_deposits ?? 0),
    todayWithdrawals: Number(todayData?.today_withdrawals ?? 0),
    todayNet: Number(todayData?.today_net ?? 0),
    transactionCount: Number(todayData?.transaction_count ?? 0),
  };

  // Filter accounts near limit (>= 80%)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nearLimitAccounts: NearLimitAccount[] = (accountsResult.data ?? [])
    .map((account: any) => {
      const inPercentage = account.monthly_in_limit > 0
        ? Math.round((Number(account.current_month_in ?? 0) / Number(account.monthly_in_limit)) * 100)
        : 0;
      const outPercentage = account.monthly_out_limit > 0
        ? Math.round((Number(account.current_month_out ?? 0) / Number(account.monthly_out_limit)) * 100)
        : 0;

      return {
        id: account.id,
        nickname: account.nickname,
        type: account.type as "holding" | "paying",
        inPercentage,
        outPercentage,
        isInCritical: inPercentage >= 95,
        isOutCritical: outPercentage >= 95,
        remainingIn: Number(account.monthly_in_limit) - Number(account.current_month_in ?? 0),
        remainingOut: Number(account.monthly_out_limit) - Number(account.current_month_out ?? 0),
      };
    })
    .filter((a: NearLimitAccount) => a.inPercentage >= 80 || a.outPercentage >= 80)
    .sort((a: NearLimitAccount, b: NearLimitAccount) => Math.max(b.inPercentage, b.outPercentage) - Math.max(a.inPercentage, a.outPercentage));

  // Recent transactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentTransactions: RecentTransaction[] = (recentResult.data ?? []).map((tx: any) => ({
    id: tx.id,
    direction: tx.direction as "in" | "out",
    amount: Number(tx.amount),
    sourceType: tx.source_type as "chime" | "platform",
    sourceName: tx.chime_nickname ?? tx.platform_name ?? "Unknown",
    gameName: tx.game_name,
    createdAt: tx.created_at,
  }));

  return {
    data: {
      stats,
      nearLimitAccounts,
      recentTransactions,
    },
    error: null,
  };
}
