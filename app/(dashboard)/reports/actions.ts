"use server";

import { createAdminClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export interface MonthlyReport {
  month: string; // e.g., "2026-02"
  monthDisplay: string; // e.g., "February 2026"
  totalDeposits: number;
  totalWithdrawals: number;
  totalATMWithdrawals: number;
  netFlow: number; // deposits - withdrawals
  currentHolding: number; // current total balance across all chimes
  transactionCount: number;
}

// ============================================
// Get Monthly Report
// ============================================

export async function getMonthlyReport(year?: number, month?: number): Promise<{
  data: MonthlyReport | null;
  error: string | null;
}> {
  const supabase = createAdminClient();
  
  // Default to current month
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1; // 1-indexed
  
  // Calculate start and end of month
  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
  
  const startDate = startOfMonth.toISOString();
  const endDate = endOfMonth.toISOString();
  const monthKey = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
  
  // Format month display
  const monthDisplay = startOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  try {
    // Get deposits total
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: depositsData, error: depositsError } = await (supabase.from("transactions") as any)
      .select("amount")
      .eq("direction", "deposit")
      .is("deleted_at", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (depositsError) throw depositsError;
    
    // Get withdrawals total (excluding ATM)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: withdrawalsData, error: withdrawalsError } = await (supabase.from("transactions") as any)
      .select("amount")
      .eq("direction", "withdraw")
      .is("deleted_at", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (withdrawalsError) throw withdrawalsError;
    
    // Get ATM withdrawals total
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: atmData, error: atmError } = await (supabase.from("atm_withdrawals") as any)
      .select("amount")
      .is("deleted_at", null)
      .gte("withdrawn_at", startDate)
      .lte("withdrawn_at", endDate);
    
    if (atmError) throw atmError;
    
    // Get current holdings (sum of all active chime account balances)
    // current_balance = initial_balance + current_month_in - current_month_out
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: holdingsData, error: holdingsError } = await (supabase.from("chime_accounts_with_totals") as any)
      .select("initial_balance, current_month_in, current_month_out")
      .eq("status", "active");
    
    if (holdingsError) throw holdingsError;
    
    // Calculate totals
    const totalDeposits = depositsData?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => sum + Number(row.amount), 
      0
    ) ?? 0;
    
    const totalWithdrawals = withdrawalsData?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => sum + Number(row.amount), 
      0
    ) ?? 0;
    
    const totalATMWithdrawals = atmData?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => sum + Number(row.amount), 
      0
    ) ?? 0;
    
    const currentHolding = holdingsData?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => {
        const initial = Number(row.initial_balance || 0);
        const monthIn = Number(row.current_month_in || 0);
        const monthOut = Number(row.current_month_out || 0);
        return sum + initial + monthIn - monthOut;
      }, 
      0
    ) ?? 0;
    
    const transactionCount = (depositsData?.length ?? 0) + (withdrawalsData?.length ?? 0);
    const netFlow = totalDeposits - totalWithdrawals;

    return {
      data: {
        month: monthKey,
        monthDisplay,
        totalDeposits,
        totalWithdrawals,
        totalATMWithdrawals,
        netFlow,
        currentHolding,
        transactionCount,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error loading monthly report:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Failed to load report" 
    };
  }
}

// ============================================
// Get Available Months (for month selector)
// ============================================

export async function getAvailableMonths(): Promise<{
  data: Array<{ value: string; label: string }> | null;
  error: string | null;
}> {
  const supabase = createAdminClient();
  const now = new Date();
  const months: Array<{ value: string; label: string }> = [];
  
  try {
    // Get the earliest transaction date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: earliestTxnData } = await (supabase.from("transactions") as any)
      .select("created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const earliestTxn = earliestTxnData?.[0] as { created_at: string } | undefined;
    
    // Start from earliest transaction or current month
    let startDate = earliestTxn 
      ? new Date(earliestTxn.created_at) 
      : now;
    
    // Generate list of months from start to current
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    let cursor = new Date(current);
    while (cursor >= start) {
      const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const label = cursor.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      months.push({ value: monthKey, label });
      cursor.setMonth(cursor.getMonth() - 1);
    }
    
    // Always return at least the current month
    if (months.length === 0) {
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const label = now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      months.push({ value: monthKey, label });
    }
    
    return { data: months, error: null };
  } catch (error) {
    console.error("Error getting available months:", error);
    // Still return current month on error
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const label = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    return { data: [{ value: monthKey, label }], error: null };
  }
}
